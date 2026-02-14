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

import { HttpService } from "@nestjs/axios";
import md5 from "md5";
import Logger from "src/logger/logger";
import { Scrobbler } from "src/prisma/generated/client";
import {
	EnablingScrobblerFailedException,
	MissingScrobblerSettingsException,
	ScrobblerRequestFailedException,
} from "../scrobbler.exceptions";
import IScrobbler, { ScrobbleData } from "./scrobbler";

export default class LastFMScrobbler
	implements IScrobbler<PrismaJson.LastFMData>
{
	private readonly logger = new Logger(LastFMScrobbler.name);
	public readonly name = Scrobbler.LastFM;
	// Given 'process.env' returns an instance of the Scrobbler
	// Will throw if the following missing environment variables are missing or empty:
	// - LASTFM_API_KEY
	// - LASTFM_API_SECRET
	static init(
		env: Record<string, string | undefined>,
		httpService: HttpService,
	): LastFMScrobbler {
		const [apiKey, apiSecret] = ["LASTFM_API_KEY", "LASTFM_API_SECRET"].map(
			(envKey) => {
				const envVar = env[envKey];

				if (envVar === undefined || !envVar.length) {
					throw new MissingScrobblerSettingsException(
						Scrobbler.LastFM,
						envKey,
					);
				}
				return envVar;
			},
		);
		return new LastFMScrobbler(apiKey, apiSecret, httpService);
	}

	protected constructor(
		protected readonly apiKey: string,
		protected readonly apiSecret: string,
		protected readonly httpService: HttpService,
	) {}

	public getUserTokenUrl(callbackUrl: string) {
		return `https://www.last.fm/api/auth/?api_key=${this.apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
	}

	public async getSessionToken(userToken: string): Promise<string> {
		try {
			const res = await this._request("auth.getSession", {
				token: userToken,
			});
			return res.session.key;
		} catch (e) {
			throw new EnablingScrobblerFailedException(
				Scrobbler.LastFM,
				e.toString(),
			);
		}
	}

	public async pushScrobbles(
		scrobbles: ScrobbleData[],
		userSetting: PrismaJson.LastFMData,
	): Promise<Date> {
		const dtos = scrobbles.map((s) => ({
			artist: s.artistName,
			track: s.songName,
			timestamp: Math.floor(s.playedAt.getTime() / 1000),
		}));
		for (let i = 0; i < dtos.length; i++) {
			const dto = dtos[i];
			try {
				await this._request(
					"track.scrobble",
					{ ...dto, sk: userSetting.sessionToken },
					true,
				);
			} catch (e) {
				if (i === 0) {
					throw e;
				}
				this.logger.error(e.toString());
				return scrobbles[i].playedAt;
			}
		}
		return scrobbles.at(-1)!.playedAt;
	}

	private async _request(
		method: string,
		params: Record<string, string | number | undefined | null>,
		post = false,
	): Promise<any> {
		const host = "http://ws.audioscrobbler.com/2.0/";
		const query = {
			api_key: this.apiKey,
			format: "json",
			method,
			...params,
		};
		const orderedQuery = Object.entries(query)
			.sort(([key1], [key2]) => key1.localeCompare(key2))
			.filter(([_, value]) => value !== undefined && value !== null);
		const signature =
			orderedQuery
				.filter(([key]) => key !== "format")
				.reduce((rest, [key, value]) => `${rest}${key}${value}`, "") +
			this.apiSecret;
		const urlParams = new URLSearchParams(orderedQuery);
		urlParams.set("api_sig", md5(signature));
		try {
			const res = await this.httpService.axiosRef.request({
				url: `${host}?${urlParams.toString()}`,
				method: post ? "POST" : "GET",
				headers: { "User-Agent": "Meelo/0.0.1" },
			});
			return res.data;
		} catch (e) {
			this.logger.error(e);
			throw new ScrobblerRequestFailedException(
				Scrobbler.LastFM,
				e.toString(),
			);
		}
	}
}
