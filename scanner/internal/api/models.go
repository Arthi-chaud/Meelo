package api

type User struct {
	Admin bool `validate:"required" json:"admin"`
}

type Page[T any] struct {
	Items    []T          `validate:"required,dive,required" json:"items"`
	Metadata PageMetadata `json:"metadata"`
}

type PageMetadata struct {
	Next  string `json:"next"`
	Count uint64 `json:"count"`
}

type Library struct {
	Id   int    `json:"id" validate:"required"`
	Name string `json:"name" validate:"required"`
	Slug string `json:"slug" validate:"required"`
	Path string `json:"path" validate:"required"`
}

type File struct {
	Id        int    `json:"id" validate:"required"`
	Path      string `json:"path" validate:"required"`
	Checksum  string `json:"checksum" validate:"required"`
	LibraryId int    `json:"libraryId" validate:"required"`
}

type MetadataCreated struct {
	TrackId int `json:"trackId" validate:"required"`
	SongId  int `json:"songId"`
}

// Do not change names of fields, they are mapped 1:1 with the query parameters of the requests
type FileSelectorDto struct {
	Library string
	Album   string
	Release string
	Song    string
	Track   string
}

type IllustrationType string

const (
	Cover     IllustrationType = "Cover"
	Thumbnail IllustrationType = "Thumbnail"
)
