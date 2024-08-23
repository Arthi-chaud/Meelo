package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/go-playground/validator/v10"
	"github.com/kpango/glg"
)

func HealthCheck(config config.Config) error {
	_, err := request("GET", "/", nil, config)
	return err
}

func GetUserFromAccessToken(config config.Config, accessToken string) (User, error) {
	config.AccessToken = accessToken
	res, err := request("GET", "/users/me", nil, config)
	if err != nil {
		return User{}, err
	}
	var u = User{}
	err = validate(res, &u)
	return u, err
}

func GetAllLibraries(config config.Config) ([]Library, error) {
	next := "/libraries"
	libraries := []Library{}
	for len(next) != 0 {
		res, err := request("GET", next, nil, config)
		if err != nil {
			return []Library{}, err
		}
		var page = Page[Library]{}
		err = validate(res, &page)
		libraries = append(libraries, page.Items...)
		next = page.Metadata.Next
	}
	return libraries, nil
}

func GetLibrary(config config.Config, librarySlug string) (Library, error) {
	res, err := request("GET", fmt.Sprintf("/libraries/%s", librarySlug), nil, config)
	if err != nil {
		return Library{}, err
	}
	var l = Library{}
	err = validate(res, &l)
	return l, err
}

func request(method string, url string, body io.Reader, config config.Config) (string, error) {
	client := &http.Client{}
	req, _ := http.NewRequest(method, fmt.Sprintf("%s%s", config.ApiUrl, url), body)
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if config.AccessToken != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", config.AccessToken))
	}
	req.Header.Set("x-api-key", config.ApiKey)
	resp, err := client.Do(req)

	if err != nil {
		glg.Fail(err)
		return "", err
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		glg.Fail(string(b))
		return "", err
	}
	if err != nil {
		glg.Fail(err)
		return "", err
	}
	return string(b), nil
}

func validate[T any](res string, obj *T) error {
	validate := validator.New(validator.WithRequiredStructEnabled())
	if err := json.Unmarshal([]byte(res), obj); err != nil {
		return err
	}
	if err := validate.Struct(*obj); err != nil {
		return err
	}
	return nil
}
