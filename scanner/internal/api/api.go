package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/go-playground/validator/v10"
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

func GetAllFiles(selector FileSelectorDto, config config.Config) ([]File, error) {
	url := "/files?"
	v := reflect.ValueOf(selector)
	typeOfS := v.Type()
	for i := 0; i < v.NumField(); i++ {
		if len(v.Field(i).String()) > 0 {
			url = url + fmt.Sprintf("%s=%s&", strings.ToLower(typeOfS.Field(i).Name), v.Field(i).String())
		}
	}
	return getAllItemsInPaginatedQuery[File](url, config)
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

func HasLyrics(config config.Config, songId int) (bool, bool, error) {
	res, err := request("GET", fmt.Sprintf("/songs/%d/lyrics", songId), nil, config, JsonContentType)

	if err != nil {
		return false, false, err
	}
	var resp = LyricsDto{}
	err = validate(res, &resp)
	if err != nil {
		return false, false, err
	}
	return len(resp.Plain) > 0, resp.Synced != nil && len(*resp.Synced) > 0, err
}

type LyricsDto struct {
	Plain  string                   `json:"plain"`
	Synced *(internal.SyncedLyrics) `json:"synced"`
}

func PostLyrics(config config.Config, songId int, plainLyrics internal.PlainLyrics, syncedLyrics *internal.SyncedLyrics) error {
	dto := LyricsDto{Plain: strings.Join(plainLyrics, "\n"), Synced: syncedLyrics}
	serialized, err := json.Marshal(dto)
	if err != nil {
		return err
	}
	_, err = request("POST", fmt.Sprintf("/songs/%d/lyrics", songId), bytes.NewBuffer(serialized), config, JsonContentType)
	return err
}

type SaveMetadataMethod string

const (
	Update SaveMetadataMethod = "Update"
	Create SaveMetadataMethod = "Create"
)

func SaveMetadata(config config.Config, m internal.Metadata, saveMethod SaveMetadataMethod) (MetadataCreated, error) {
	reqBody := new(bytes.Buffer)
	mp := multipart.NewWriter(reqBody)
	mp.WriteField("compilation", strconv.FormatBool(m.IsCompilation))
	mp.WriteField("artist", m.Artist)
	if len(m.SortArtist) > 0 {
		mp.WriteField("sortArtist", m.SortArtist)
	}
	if len(m.AlbumArtist) > 0 {
		mp.WriteField("albumArtist", m.AlbumArtist)
		if len(m.SortAlbumArtist) > 0 {
			mp.WriteField("sortAlbumArtist", m.SortAlbumArtist)
		}
	}
	if len(m.Album) > 0 {
		mp.WriteField("album", m.Album)
		if len(m.SortAlbum) > 0 {
			mp.WriteField("sortAlbum", m.SortAlbum)
		}
	}
	if len(m.Release) > 0 {
		mp.WriteField("release", m.Release)
	}
	mp.WriteField("name", m.Name)
	if len(m.SortName) > 0 {
		mp.WriteField("sortName", m.SortName)
	}
	if m.AlbumReleaseDate != nil {
		mp.WriteField("albumReleaseDate", (*m.AlbumReleaseDate).Format(time.RFC3339))
	}
	if m.ReleaseReleaseDate != nil {
		mp.WriteField("releaseReleaseDate", (*m.ReleaseReleaseDate).Format(time.RFC3339))
	}
	if m.Index >= 0 {
		mp.WriteField("index", strconv.FormatInt(m.Index, 10))
	}
	if m.DiscIndex > 0 {
		mp.WriteField("discIndex", strconv.FormatInt(m.DiscIndex, 10))
	}
	if len(m.DiscName) > 0 {
		mp.WriteField("discName", m.DiscName)
	}
	if m.Bitrate > 0 {
		mp.WriteField("bitrate", strconv.FormatInt(m.Bitrate, 10))
	}
	if m.Duration > 0 {
		mp.WriteField("duration", strconv.FormatInt(m.Duration, 10))
	}
	if m.Bpm > 0 {
		mp.WriteField("bpm", fmt.Sprintf("%.2f", m.Bpm))
	}
	if len(m.Label) > 0 {
		mp.WriteField("label", m.Label)
	}
	mp.WriteField("type", string(m.Type))
	for i, genre := range m.Genres {
		mp.WriteField(fmt.Sprintf("genres[%d]", i), genre)
	}
	if len(m.DiscogsId) > 0 {
		mp.WriteField("discogsId", m.DiscogsId)
	}
	mp.WriteField("registrationDate", m.RegistrationDate.Format(time.RFC3339))
	mp.WriteField("checksum", m.Checksum)
	mp.WriteField("path", m.Path)
	if m.Fingerprint != nil {
		mp.WriteField("fingerprint", *m.Fingerprint)
	}
	mp.Close()

	method := "POST"
	if saveMethod == Update {
		method = "PUT"
	}

	res, err := request(method, "/metadata", reqBody, config, mp.FormDataContentType())
	if err != nil {
		return MetadataCreated{}, err
	}
	dto := MetadataCreated{}
	err = validate(res, &dto)
	return dto, err
}

func PostIllustration(config config.Config, trackId int, imageType IllustrationType, imageBytes []byte) error {
	reqBody := new(bytes.Buffer)
	mp := multipart.NewWriter(reqBody)

	mp.WriteField("type", string(imageType))
	mp.WriteField("trackId", strconv.FormatInt(int64(trackId), 10))
	part, err := mp.CreateFormFile("file", "cover.jpg")
	if err != nil {
		return err
	}
	part.Write(imageBytes)
	mp.Close()

	_, err = request("POST", "/illustrations/file", reqBody, config, mp.FormDataContentType())
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
		return "", errors.Join(errors.New("Request to API failed: "), err)
	}
	defer resp.Body.Close()
	b, err := io.ReadAll(resp.Body)
	if resp.StatusCode >= 400 {
		return "", errors.Join(
			errors.New("Request to API failed: "),
			fmt.Errorf("Unexpected Status Code: %d", resp.StatusCode),
			errors.New(string(b)))
	}
	if err != nil {
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
