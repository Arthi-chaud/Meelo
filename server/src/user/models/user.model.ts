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

import { ApiProperty } from "@nestjs/swagger";

export class User {
	@ApiProperty({
		description: "Unique numeric user identifier",
		example: 123,
		type: "integer",
		format: "int32",
	})
	id!: number;
	@ApiProperty({
		description: "the username",
	})
	name!: string;
	@ApiProperty({
		description: "the hashed password of the user's account",
	})
	password!: string;
	@ApiProperty({
		description: "Indicates if the user is allowed to use the application",
	})
	enabled!: boolean;
	@ApiProperty({
		description: "Indicates if the user is an admin or not",
	})
	admin!: boolean;
}
