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
import { User } from "src/prisma/models";

/**
 * Response type on login
 */
export class JwtResponse {
	@ApiProperty({
		description:
			"JWT Access Token. To add to request's header for authenticated requests",
	})
	access_token: string;
}

/**
 * Type of the decoded JWT Payload
 */
export class JwtPayload extends PickType(User, ["id", "name"]) {}
