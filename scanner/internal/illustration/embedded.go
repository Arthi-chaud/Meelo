package illustration

import (
	"bytes"
	"fmt"
	ffmpeg_go "github.com/u2takey/ffmpeg-go"
	"gopkg.in/vansante/go-ffprobe.v2"
)

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
