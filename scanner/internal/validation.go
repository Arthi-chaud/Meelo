package internal

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

// Parameters should be the returned error from validator.New().Struct(..)
// prefix will be added at the beginning of every returned errors
func PrettifyValidationError(validationsErrs error, prefix string) []error {
	var errors []error
	if validationsErrs != nil {
		for _, validationErr := range validationsErrs.(validator.ValidationErrors) {
			var err = fmt.Errorf(
				"%s: validation failed for '%s'. constraint: %s(%s), Got '%s'",
				prefix,
				validationErr.StructNamespace(), validationErr.Tag(),
				validationErr.Param(), validationErr.Value(),
			)
			errors = append(errors, err)
		}
	}
	return errors
}
