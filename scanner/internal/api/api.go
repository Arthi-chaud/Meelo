package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/go-playground/validator/v10"
	"github.com/kpango/glg"
)

const JsonContentType = "application/json"

func HealthCheck(config config.Config) error {
	_, err := request("GET", "/", nil, config, "")
	return err
}

func GetUserFromAccessToken(config config.Config, accessToken string) (User, error) {
	config.AccessToken = accessToken
	res, err := request("GET", "/users/me", nil, config, "")
	if err != nil {
		return User{}, err
	}
	var u = User{}
	err = validate(res, &u)
	return u, err
}

func GetAllFilesInLibrary(librarySlug string, config config.Config) ([]File, error) {
	return getAllItemsInPaginatedQuery[File](fmt.Sprintf("/files?library=%s", librarySlug), config)
}

func GetAllLibraries(config config.Config) ([]Library, error) {
	return getAllItemsInPaginatedQuery[Library]("/libraries", config)
}

func GetLibrary(config config.Config, librarySlug string) (Library, error) {
	res, err := request("GET", fmt.Sprintf("/libraries/%s", librarySlug), nil, config, "")
	if err != nil {
		return Library{}, err
	}
	var l = Library{}
	err = validate(res, &l)
	return l, err
}

type FileDeletionDto struct {
	FileIds []int `json:"ids"`
}

func DeleteFiles(config config.Config, fileIds []int) error {
	dto := FileDeletionDto{FileIds: fileIds}
	serialized, err := json.Marshal(dto)
	if err != nil {
		return err
	}
	_, err = request("DELETE", "/files", bytes.NewBuffer(serialized), config, JsonContentType)
	return err
}

func PostMetadata(config config.Config, m internal.Metadata) (MetadataCreated, error) {
	reqBody := new(bytes.Buffer)
	mp := multipart.NewWriter(reqBody)
	mp.WriteField("compilation", strconv.FormatBool(m.IsCompilation))
	mp.WriteField("artist", m.Artist)
	if len(m.AlbumArtist) > 0 {
		mp.WriteField("albumArtist", m.AlbumArtist)
	}
	mp.WriteField("album", m.Album)
	mp.WriteField("release", m.Release)
	mp.WriteField("name", m.Name)
	mp.WriteField("releaseDate", m.ReleaseDate.Format(time.RFC3339))
	if m.Index > 0 {
		mp.WriteField("index", strconv.FormatInt(m.Index, 10))
	}
	if m.DiscIndex > 0 {
		mp.WriteField("discIndex", strconv.FormatInt(m.DiscIndex, 10))
	}
	if m.Bitrate > 0 {
		mp.WriteField("bitrate", strconv.FormatInt(m.Bitrate, 10))
	}
	if m.Duration > 0 {
		mp.WriteField("duration", strconv.FormatInt(m.Duration, 10))
	}

	mp.WriteField("type", string(m.Type))
	for i, genre := range m.Genres {
		mp.WriteField(fmt.Sprintf("genres[%d]", i), genre)
	}
	if len(m.DiscogsId) > 0 {
		mp.WriteField("discogsId", m.DiscogsId)
	}
	if len(m.IllustrationBytes) > 0 {
		part, err := mp.CreateFormFile("illustration", "cover.jpg")
		if err != nil {
			glg.Fail(err)
			return MetadataCreated{}, err
		}
		part.Write(m.IllustrationBytes)
	}
	mp.WriteField("registrationDate", m.RegistrationDate.Format(time.RFC3339))
	mp.WriteField("checksum", m.Checksum)
	mp.WriteField("path", m.Path)
	mp.Close()

	res, err := request("POST", "/metadata", reqBody, config, mp.FormDataContentType())
	if err != nil {
		return MetadataCreated{}, err
	}
	dto := MetadataCreated{}
	err = validate(res, &dto)
	return dto, err
}

func PostThumbnail(config config.Config, trackId int, thumbnailBytes []byte) error {
	reqBody := new(bytes.Buffer)
	mp := multipart.NewWriter(reqBody)

	part, err := mp.CreateFormFile("thumbnail", "cover.jpg")
	if err != nil {
		glg.Fail(err)
		return err
	}
	part.Write(thumbnailBytes)
	mp.Close()

	_, err = request("POST", fmt.Sprintf("/tracks/%d/thumbnail", trackId), reqBody, config, mp.FormDataContentType())
	return err
}

func request(method string, url string, body io.Reader, config config.Config, contentType string) (string, error) {
	client := &http.Client{}
	req, _ := http.NewRequest(method, fmt.Sprintf("%s%s", config.ApiUrl, url), body)
	if body != nil {
		req.Header.Set("Content-Type", contentType)
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
		return "", fmt.Errorf("request failed")
	}
	if err != nil {
		glg.Fail(err)
		return "", err
	}
	return string(b), nil
}

func getAllItemsInPaginatedQuery[T any](path string, c config.Config) ([]T, error) {
	next := path
	items := []T{}
	for len(next) != 0 {
		res, err := request("GET", next, nil, c, "")
		if err != nil {
			return []T{}, err
		}
		var page = Page[T]{}
		err = validate(res, &page)
		items = append(items, page.Items...)
		next = page.Metadata.Next
	}
	return items, nil
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
