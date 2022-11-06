import { ApiProperty } from "@nestjs/swagger";

export default class LoginDTO {
	@ApiProperty({
		required: true,
		description: "The user's username"
	})
	username: string;
	@ApiProperty({
		required: true,
		description: "The plain password of the user"
	})
	password: string;
}