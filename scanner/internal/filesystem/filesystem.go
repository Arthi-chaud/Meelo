package filesystem

import (
	"os"
	"path"
)

const IgnoreFileName = ".ignore"

// Walks through the file system from the given root
// Does not return content of directories that contain a '.ignore' file
func GetAllFilesInDirectory(dir string) ([]string, error) {
	files := []string{}
	entries, err := os.ReadDir(dir)

	if err != nil {
		return []string{}, err
	}

	for _, e := range entries {
		if e.Name() == IgnoreFileName {
			return []string{}, nil
		}
		entryPath := path.Join(dir, e.Name())
		i, err := os.Stat(entryPath)
		if err != nil {
			return []string{}, err
		}
		if i.IsDir() {
			filesInDir, err := GetAllFilesInDirectory(entryPath)
			if err != nil {
				return []string{}, err
			}
			files = append(files, filesInDir...)
		} else {
			files = append(files, entryPath)
		}
	}
	return files, nil
}
