package illustration

import (
	"bytes"
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/u2takey/ffmpeg-go"
	"gocv.io/x/gocv"
)

type CropDimensions struct {
	width  int
	height int
	x      int
	y      int
}

var classifier gocv.CascadeClassifier

// Extract a 'good' thumbnail from a video file
// The returned keyframes will have its black bars removed (when possible)
//
// A thumbnail is a keyframe that contains a face whose width is > keyframe's width.
// We return the first keyframe that matches this criteria.
//
// If we can't find any faces,we naively return a fame in the middle of the video.
// This is why we need a duration. Duration can be zero, in that case we get a frame at 5s.
//
// For performance reasons, we limit the search to the first 5 minutes of the video.
func GetThumbnail(filepath string, duration int64) ([]byte, error) {
	bytes, crops, err := GetFrameWithFace(filepath)
	if err != nil || len(bytes) == 0 {
		timestamp := duration / 2
		if timestamp == 0 {
			timestamp = 5
		}
		bytes, crops, err = GetFrameAtTimestamp(filepath, timestamp)
	}
	if err != nil {
		return []byte{}, err
	}
	if crops != nil {
		croppedThumbnail, _ := RemoveBlackBars(&bytes, crops)
		if croppedThumbnail != nil {
			return croppedThumbnail, nil
		}
	}
	return bytes, nil
}

func GetFrameWithFace(filepath string) ([]byte, *CropDimensions, error) {
	outDir := fmt.Sprintf("/tmp/thumbnail-%s", uuid.New().String())
	os.Mkdir(outDir, 0700)

	rawout := bytes.NewBuffer(nil)
	filters := []string{
		"yadif",
		"scale='max(iw,iw*sar)':'max(ih,ih/sar)'",
		"select=gte(pict_type\\,PICT_TYPE_I)",
		"cropdetect",
	}
	ffmpeg_go.Input(filepath, ffmpeg_go.KwArgs{
		"skip_frame": "nokey",
		"to":         "0:05:00",
	}).
		Silent(true).
		Output(path.Join(outDir, "thumbnails-%03d.jpeg"), ffmpeg_go.KwArgs{
			"vsync":    "vfr",
			"qscale:v": "2",
			"format":   "image2",
			"vcodec":   "mjpeg",
			"vf":       strings.Join(filters, ","),
		}).
		WithErrorOutput(rawout).
		Run()

	if (classifier == gocv.CascadeClassifier{}) {
		classifier = gocv.NewCascadeClassifier()
		if !classifier.Load("./data/lbp.xml") {
			return nil, nil, fmt.Errorf("Error reading cascade file.")
		}
	}
	items, _ := os.ReadDir(outDir)
	var bestImageBytes *[]byte = nil
	for _, item := range items {
		b, _ := os.ReadFile(path.Join(outDir, item.Name()))
		img, _ := gocv.IMDecode(b, 1)
		rects := classifier.DetectMultiScale(img)
		if len(rects) != 1 {
			continue
		}
		bestImageBytes = &b
		break
	}
	os.RemoveAll(outDir)
	if bestImageBytes == nil {
		return nil, nil, nil
	}
	crops, err := ParseCropDimensions(rawout.String())
	if err == nil {
		return *bestImageBytes, crops, nil
	}
	return *bestImageBytes, nil, nil
}

func GetFrameAtTimestamp(filepath string, timestamp int64) ([]byte, *CropDimensions, error) {
	rawout := bytes.NewBuffer(nil)
	formattedDuration := fmt.Sprintf("%.2d:%.2d:%.2d", int(timestamp/3600), (timestamp/60)%60, timestamp%60)
	thumbnail := bytes.NewBuffer(nil)
	filters := []string{
		"yadif",
		"scale='max(iw,iw*sar)':'max(ih,ih/sar)'",
		"select=gte(n\\,1)",
		"cropdetect",
	}

	cmd := ffmpeg_go.Input(filepath, ffmpeg_go.KwArgs{"ss": formattedDuration}).
		Silent(true).
		Output("pipe:", ffmpeg_go.KwArgs{
			"vframes": 1,
			"format":  "image2",
			"vcodec":  "mjpeg",
			"vf":      strings.Join(filters, ", ")}).
		WithOutput(thumbnail).
		WithErrorOutput(rawout)
	err := cmd.Run()
	if err != nil {
		return nil, nil, err
	}
	thumbnailBytes := thumbnail.Bytes()
	crops, err := ParseCropDimensions(rawout.String())
	if err != nil {
		return thumbnailBytes, crops, nil
	}
	return thumbnailBytes, nil, nil
}

func RemoveBlackBars(frame *[]byte, crops *CropDimensions) ([]byte, error) {
	if crops == nil {
		return nil, nil
	}
	newFrame := bytes.NewBuffer(nil)
	err := ffmpeg_go.Input("pipe:", ffmpeg_go.KwArgs{"format": "image2pipe"}).
		Silent(true).
		Filter("crop", ffmpeg_go.Args{fmt.Sprintf("%d:%d:%d:%d", crops.width, crops.height, crops.x, crops.y)}).
		Output("pipe:", ffmpeg_go.KwArgs{
			"format":  "image2",
			"vframes": "1",
			"vcodec":  "mjpeg"}).
		WithInput(bytes.NewBuffer(*frame)).
		WithOutput(newFrame).Run()
	if err != nil {
		return nil, err
	}
	return newFrame.Bytes(), err
}

func ParseCropDimensions(strout string) (*CropDimensions, error) {
	lines := strings.Split(strout, "\n")
	lineCount := len(lines)
	if lineCount == 0 {
		return nil, nil
	}
	for index := lineCount; index > 0; index-- {
		token := "crop="
		line := lines[index-1]
		cropPos := strings.Index(line, token)
		if cropPos == -1 {
			continue
		}
		dims := CropDimensions{}
		_, err := fmt.Sscanf(line[cropPos+len(token):], "%d:%d:%d:%d",
			&dims.width, &dims.height, &dims.x, &dims.y)
		if err != nil {
			log.Debug().Msg(err.Error())
			continue
		}
		if dims.width < 0 || dims.height < 0 {
			continue
		}
		return &dims, nil
	}
	return nil, nil
}
