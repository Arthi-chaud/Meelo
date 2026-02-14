package internal

import (
	"encoding/json"
	"os/exec"
)

type Fingerprint struct {
	Fingerprint string `json:"fingerprint"`
}

func GetFileAcousticFingerprint(filepath string) (string, error) {
	cmd := exec.Command("fpcalc", filepath, "-json", "-algorithm", "2", "-overlap", "-channels", "2")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	res := Fingerprint{}
	err = json.Unmarshal([]byte(output), &res)
	if err != nil {
		return "", err
	}
	return res.Fingerprint, nil
}
