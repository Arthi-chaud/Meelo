package illustration

import (
	"bytes"
	"fmt"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/u2takey/ffmpeg-go"
)

type CropDimensions struct {
	width  int
	height int
	x      int
	y      int
}

func GetFrame(filepath string, timestamp int64) ([]byte, error) {
	formattedDuration := fmt.Sprintf("%.2d:%.2d:%.2d", int(timestamp/3600), (timestamp/60)%60, timestamp%60)
	thumbnail := bytes.NewBuffer(nil)
	filters := []string{
		"scale='max(iw,iw*sar)':'max(ih,ih/sar)'",
		"select=gte(n\\,1)",
	}

	cmd := ffmpeg_go.Input(filepath, ffmpeg_go.KwArgs{"ss": formattedDuration}).
		Silent(true).
		Output("pipe:", ffmpeg_go.KwArgs{
			"vframes": 1,
			"format":  "image2",
			"vcodec":  "mjpeg",
			"vf":      strings.Join(filters, ", ")}).
		WithOutput(thumbnail)
	err := cmd.Run()
	if err != nil {
		return nil, err
	}
	thumbnailBytes := thumbnail.Bytes()
	croppedThumbnail, err := RemoveBlackBars(&thumbnailBytes)
	if croppedThumbnail != nil {
		return croppedThumbnail.Bytes(), nil
	}
	return thumbnailBytes, err
}

func RemoveBlackBars(frame *[]byte) (*bytes.Buffer, error) {

	crops, err := GetCropDimensions(bytes.NewBuffer(*frame))
	if err != nil || crops == nil {
		return nil, err
	}
	newFrame := bytes.NewBuffer(nil)
	err = ffmpeg_go.Input("pipe:", ffmpeg_go.KwArgs{"format": "image2pipe"}).
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
	return newFrame, err
}

func GetCropDimensions(thumbnail *bytes.Buffer) (*CropDimensions, error) {

	rawout := bytes.NewBuffer(nil)

	err := ffmpeg_go.Input("pipe:", ffmpeg_go.KwArgs{"f": "image2pipe", "loop": "1"}).
		Silent(true).
		Output("pipe:", ffmpeg_go.KwArgs{
			"f":        "null",
			"frames:v": "3",
			"vf":       "cropdetect=limit=0:round=0"}).
		WithErrorOutput(rawout).
		WithInput(thumbnail).
		WithOutput(rawout).Run()
	if err != nil {
		return nil, err
	}
	strout := string((*rawout).Bytes())
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
		_, err = fmt.Sscanf(line[cropPos+len(token):], "%d:%d:%d:%d",
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
