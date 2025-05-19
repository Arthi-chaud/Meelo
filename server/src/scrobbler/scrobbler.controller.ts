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

import { Body, Controller, Post, Query, Request } from "@nestjs/common";
import { Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { User } from "@prisma/client";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import { EnableLastFMDTO, LastFMAuthUrlResponse } from "./models/lastfm.dto";
import ScrobblerService from "./scrobbler.service";

@ApiTags("Scrobbler")
@Controller("scrobblers")
export default class ScrobblerController {
	constructor(private scrobblerService: ScrobblerService) {}

	@Get()
	@ApiOperation({
		summary: "Get available and enabled/disabled scrobblers",
	})
	@Role(Roles.User)
	async getScrobblers(@Request() req: Express.Request) {
		const userId = (req.user as User).id;
		return await this.scrobblerService.getScrobblersForUser(userId);
	}

	@ApiOperation({
		summary: "Get the URL to get a user token",
		description:
			"The callback url is the one that will be called with a 'token' query param",
	})
	@Get("/lastfm/url")
	getLastFMUserTokenUrl(
		@Query("callback") callbackUrl: string,
	): LastFMAuthUrlResponse {
		const url = this.scrobblerService.getLastFMUserTokenUrl(callbackUrl);

		return { url };
	}

	@Post("/lastfm")
	@Role(Roles.User)
	async enableLastFMScrobbler(
		@Request() req: Express.Request,
		@Body() dto: EnableLastFMDTO,
	) {
		await this.scrobblerService.enableLastFM(
			(req.user as User).id,
			dto.token,
		);
	}

	// @Post()
	// async enableListenBrainzScrobbler() {}
}
