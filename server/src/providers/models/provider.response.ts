import { ApiProperty } from "@nestjs/swagger";

/**
 * Response format of a Provider resource
 */
export default class ProviderResponse {
	@ApiProperty({
		description: 'Name of the Provider'
	})
	name: string;

	@ApiProperty({
		description: 'Homepage of the provider'
	})
	homepage: string;

	@ApiProperty({
		description: "Local URL to the provider's banner"
	})
	banner: string;

	@ApiProperty({
		description: "Local URL to the provider's icon"
	})
	icon: string;
}
