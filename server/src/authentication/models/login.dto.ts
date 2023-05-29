import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export default class LoginDTO {
	@ApiProperty({
		required: true,
		description: "The user's username"
	})
	@IsString()
	@IsNotEmpty()
	username: string;

	@ApiProperty({
		required: true,
		description: "The plain password of the user"
	})
	@IsString()
	@IsNotEmpty()
	password: string;
}
