import { ApiQuery } from "@nestjs/swagger";

export function ApiRelationInclude(keys: readonly string[], name: string = 'with') {
	return ApiQuery({
		name,
		required: false,
		type: String,
		isArray: true,
		style: 'label',
		enum: keys
	})
}