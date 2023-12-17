/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { User } from "src/prisma/models";

export default class UserCreateDTO extends PickType(User, [
	"name",
	"password",
]) {
	@ApiProperty({
		required: true,
		description:
			"The user's username. Must be at least 4 characters long, composed of letters, digits, dash and underscore",
	})
	@IsString()
	@IsNotEmpty()
	name: string;

	@ApiProperty({
		required: true,
		description:
			"The plain password of the user. Must be at least 6 characters long",
	})
	@IsString()
	@IsNotEmpty()
	password: string;
}
