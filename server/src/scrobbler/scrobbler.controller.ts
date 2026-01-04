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

import {
	Body,
	Controller,
	Delete,
	Get,
	Post,
	Query,
	Request,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Scrobbler, User } from "src/prisma/generated/client";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import { EnableLastFMDTO, LastFMAuthUrlResponse } from "./models/lastfm.dto";
import { EnableListenBrainzDTO } from "./models/listenbrainz.dto";
import ScrobblerService from "./scrobbler.service";

@ApiTags("Scrobbler")
@Controller("scrobblers")
export default class ScrobblerController {
	constructor(private scrobblerService: ScrobblerService) {}

	@Get()
	@ApiOperation({
		summary: "Get the list of available and connected scrobblers",
	})
	@Role(Roles.User)
	async getScrobblers(@Request() req: Express.Request) {
		const userId = (req.user as User).id;
		return await this.scrobblerService.getScrobblersForUser(userId);
	}

	@ApiOperation({
		summary: "Get the URL to get a user token",
		description:
			"After authentication, the user will be redirected to the callback url with a 'token' query param",
	})
	@Role(Roles.User)
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

	@Delete("/lastfm")
	@Role(Roles.User)
	async disableLastFMScrobbler(@Request() req: Express.Request) {
		await this.scrobblerService.disableScrobbler(
			(req.user as User).id,
			Scrobbler.LastFM,
		);
	}

	@Post("/listenbrainz")
	@Role(Roles.User)
	async enableListenBrainzScrobbler(
		@Request() req: Express.Request,
		@Body() dto: EnableListenBrainzDTO,
	) {
		await this.scrobblerService.enableListenBrainz(
			(req.user as User).id,
			dto.token,
			dto.instanceUrl,
		);
	}

	@Delete("/listenbrainz")
	@Role(Roles.User)
	async disableListenBrainzScrobbler(@Request() req: Express.Request) {
		await this.scrobblerService.disableScrobbler(
			(req.user as User).id,
			Scrobbler.ListenBrainz,
		);
	}
}
