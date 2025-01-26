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

import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "src/prisma/models";
import UserService from "src/user/user.service";
import {
	DisabledUserAccountException,
	UnknownUserException,
} from "./authentication.exception";
import { JwtPayload, JwtResponse } from "./models/jwt.models";

@Injectable()
export default class AuthenticationService {
	constructor(
		private userService: UserService,
		private jwtService: JwtService,
	) {}

	async validateUser(
		username: string,
		plainTextPassword: string,
	): Promise<User> {
		try {
			const requestedUser = await this.userService.get({
				byCredentials: {
					name: username,
					password: plainTextPassword,
				},
			});

			if (!requestedUser.enabled) {
				throw new DisabledUserAccountException();
			}
			return requestedUser;
		} catch (error) {
			if (error instanceof DisabledUserAccountException) {
				throw error;
			}
			throw new UnknownUserException();
		}
	}

	async login(user: User): Promise<JwtResponse> {
		const payload: JwtPayload = { name: user.name, id: user.id };

		return {
			access_token: this.jwtService.sign(payload),
		};
	}
}
