package filesystem

import (
	"os"
	"path"

	"github.com/rs/zerolog/log"
)

const IgnoreFileName = ".ignore"

// Walks through the file system from the given root
// Does not return content of directories that contain a '.ignore' file
//
// It ignores hidden files/directories (unix)
//
// It only fails if the root dir cannot be opened.
// Stats/ReadDir failures on children will be logged.
func GetAllFilesInDirectory(dir string) ([]string, error) {
	files := []string{}
	entries, err := os.ReadDir(dir)

	if err != nil {
		return []string{}, err
	}

	for _, entry := range entries {
		entryName := entry.Name()
		if entryName == IgnoreFileName {
			return []string{}, nil
		}
		if len(entryName) > 1 && entryName[0] == '.' {
			continue
		}
		entryPath := path.Join(dir, entryName)
		i, err := os.Stat(entryPath)
		if err != nil {
			log.Warn().
				Str("file", path.Base(entryPath)).
				Msg("Could not run 'stat' on file or directory")
			log.Trace().Msg(err.Error())
			continue
		}
		if i.IsDir() {
			filesInDir, err := GetAllFilesInDirectory(entryPath)
			if err != nil {
				log.Warn().
					Str("file", path.Base(entryPath)).
					Msg("Failed to get files in directory")
				log.Trace().Msg(err.Error())
				continue
			}
			files = append(files, filesInDir...)
		} else {
			files = append(files, entryPath)
		}
	}
	return files, nil
}
