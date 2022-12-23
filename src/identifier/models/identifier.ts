import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty } from "class-validator";

/**
 * An identifer is a value that uniquely identifies a resource.
 * It could be its ID in the database, its slug, or a combination of slug (e.g. for a song)
 */
type Identifier = number | string;

/**
 * Wrapper of 'idOrSlug' route parameter.
 * Responsible for transformation and OpenAPI docuemntation
 */
export class IdentifierParam {
	@ApiProperty({
		// Does not impact parsing, only for openapi
		type: String,
		description: 'The Unique identifier of the resource. Could be its id or its slug'
	})
	@IsNotEmpty()
	@Transform(({ value }): Identifier => {
		value = String(value);
		if (isNaN(+value)) {
			return value;
		}
		return parseInt(value);
	})
	idOrSlug: Identifier;
}

export default Identifier;
