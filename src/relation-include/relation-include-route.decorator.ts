import { ApiQuery } from "@nestjs/swagger";

export function ApiRelationInclude(keys: readonly string[], name = 'with') {
	return ApiQuery({
		name,
		required: false,
		description: 'The relations to include with the returned object',
		type: String,
		isArray: true,
		style: 'label',
		enum: keys
	});
}
