import { ApiProperty, PickType } from "@nestjs/swagger";
import { User } from "src/prisma/models";

export default class UserCreateDTO extends PickType(User, ['name', 'password']) {
	@ApiProperty({
		required: true,
		description: "The user's username. Must be at least 4 characters long, composed of letters, digits, dash and underscore"
	})
	name: string;

	@ApiProperty({
		required: true,
		description: "The plain password of the user. Must be at least 6 characters long"
	})
	password: string;
}