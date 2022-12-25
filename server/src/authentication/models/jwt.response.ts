import { ApiProperty } from "@nestjs/swagger";

/**
 * Response type on login
 */
export default class JwtResponse {
	@ApiProperty({
		description: "JWT Access Token. To add to request's header for authenticated requests"
	})
	access_token: string;
}
