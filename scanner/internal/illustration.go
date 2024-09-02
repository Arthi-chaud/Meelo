package internal

import (
	"bytes"
	"fmt"
	"os"
	"path"
	"regexp"

	ffmpeg_go "github.com/u2takey/ffmpeg-go"
	"gopkg.in/vansante/go-ffprobe.v2"
)

const IllustrationNameRegex = "(cover|artwork)\\..*$"

func GetIllustrationFilePath(trackPath string) string {
	parentDir := path.Dir(trackPath)
	entries, err := os.ReadDir(parentDir)
	if err != nil {
		return ""
	}
	regex := regexp.MustCompile(IllustrationNameRegex)
	for _, file := range entries {
		if file.IsDir() {
			continue
		}
		matches := regex.FindStringSubmatch(file.Name())
		if len(matches) > 0 {
			fullFilePath := path.Join(parentDir, file.Name())
			return fullFilePath
		}
	}
	return ""
}

func GetEmbeddedIllustrationStreamIndex(probeData ffprobe.ProbeData) int {
	for _, stream := range probeData.Streams {
		if stream != nil && stream.Disposition.AttachedPic == 1 {
			return stream.Index
		}
	}
	return -1
}

func ExtractEmbeddedIllustration(filePath string, illustrationStreamIndex int) ([]byte, error) {
	buf := bytes.NewBuffer(nil)
	err := ffmpeg_go.Input(filePath).
		Silent(true).
		Get(fmt.Sprintf("%d", illustrationStreamIndex)).
		Output("pipe:", ffmpeg_go.KwArgs{"vcodec": "mjpeg", "format": "image2"}).
		WithOutput(buf).Run()
	return buf.Bytes(), err
}
