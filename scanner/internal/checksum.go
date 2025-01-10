package internal

import (
	"crypto/sha256"
	"fmt"
	"os"
)

func ComputeChecksum(filepath string) (string, error) {
	stat, err := os.Stat(filepath)
	if err != nil {
		return "", err
	}
	fileDate := stat.ModTime()
	fileSize := stat.Size()
	hashSource := fmt.Sprintf("%s-%s-%d", filepath, fileDate.Format("2006-01-02 15:04:05"), fileSize)

	// SRC: https://gobyexample.com/sha256-hashes
	h := sha256.New()
	h.Write([]byte(hashSource))
	checksum := h.Sum(nil)

	return fmt.Sprintf("%x", checksum), nil
}
