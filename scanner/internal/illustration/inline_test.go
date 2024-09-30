package illustration

import (
	"github.com/stretchr/testify/assert"
	"path"
	"testing"
)

func TestGetIllustrationPath(t *testing.T) {
	mediaPath := path.Join("..", "..", "testdata", "dreams.m4a")
	illustrationPath := GetIllustrationFilePath(mediaPath)

	assert.Equal(t, "../../testdata/cover.jpg", illustrationPath)
}
