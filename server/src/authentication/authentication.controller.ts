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

import { Body, Controller, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import AuthenticationService from "./authentication.service";
import LoginDTO from "./models/login.dto";
import { Public } from "./roles/roles.decorators";

@ApiTags("Authentication")
@Controller("auth")
export default class AuthenticationController {
	constructor(private authenticationService: AuthenticationService) {}

	@ApiOperation({
		summary: "Login user",
	})
	@Public()
	@Post("login")
	async login(@Body() loginDTO: LoginDTO) {
		const user = await this.authenticationService.validateUser(
			loginDTO.username,
			loginDTO.password,
		);
		return this.authenticationService.login(user);
	}
}
