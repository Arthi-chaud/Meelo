package internal

import (
	"fmt"

	"github.com/go-playground/validator/v10"
)

// Parameters should be the returned error from validator.New().Struct(..)
// prefix will be added at the beginning of every returned errors
func PrettifyValidationError(validationsErrs error, prefix string) []string {
	var errors []string
	if validationsErrs != nil {
		for _, validationErr := range validationsErrs.(validator.ValidationErrors) {
			var errMsg = fmt.Sprintf(
				"%s: validation failed for '%s'. Constraint: %s(%s), Got '%s'\n",
				prefix,
				validationErr.StructNamespace(), validationErr.Tag(),
				validationErr.Param(), validationErr.Value(),
			)
			errors = append(errors, errMsg)
		}
	}
	return errors
}
