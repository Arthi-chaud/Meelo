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
