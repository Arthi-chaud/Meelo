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

import AuthenticationService from "./authentication.service";
import { Controller, Post, Request, UseGuards } from "@nestjs/common";
import * as Express from "express";
import { LocalAuthGuard } from "./local/local-auth.guard";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "src/prisma/models";
import LoginDTO from "./models/login.dto";
import { Public } from "./roles/public.decorator";

@ApiTags("Authentication")
@Controller("auth")
export default class AuthenticationController {
	constructor(private authenticationService: AuthenticationService) {}

	@ApiOperation({
		summary: "Login user",
	})
	@ApiBody({
		type: LoginDTO,
	})
	@Public()
	@UseGuards(LocalAuthGuard)
	@Post("login")
	async login(@Request() request: Express.Request) {
		return this.authenticationService.login(request.user as User);
	}
}
