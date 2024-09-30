package illustration

import (
	"os"
	"path"
	"regexp"
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
