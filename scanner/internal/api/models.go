package api

type User struct {
	Admin bool `validate:"required" json:"admin"`
}
