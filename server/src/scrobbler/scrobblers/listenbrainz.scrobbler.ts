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
import { Scrobbler } from "src/prisma/generated/client";
import Logger from "src/logger/logger";
import { ScrobblerRequestFailedException } from "../scrobbler.exceptions";
import IScrobbler, { ScrobbleData } from "./scrobbler";

export default class ListenBrainzScrobbler
	implements IScrobbler<PrismaJson.ListenBrainzData>
{
	private readonly logger = new Logger(ListenBrainzScrobbler.name);
	public readonly name = Scrobbler.ListenBrainz;
	static init(
		_env: Record<string, string | undefined>,
		httpService: HttpService,
	): ListenBrainzScrobbler {
		return new ListenBrainzScrobbler(httpService);
	}

	protected constructor(protected readonly httpService: HttpService) {}

	// Simply checks that the user token is valid for the given instance
	public async validateToken(
		token: string,
		instanceUrl: string | null,
	): Promise<boolean> {
		const res = await this._request("/1/validate-token", undefined, "GET", {
			userToken: token,
			instanceUrl,
		});
		return res.valid === true;
	}

	public async pushScrobbles(
		scrobbles: ScrobbleData[],
		userSettings: PrismaJson.ListenBrainzData,
	): Promise<Date> {
		// Doc: https://listenbrainz.readthedocs.io/en/latest/users/json.html#json-doc
		const entries = scrobbles.map((s) => ({
			listened_at: Math.floor(s.playedAt.getTime() / 1000),
			track_metadata: {
				artist_name: s.artistName,
				track_name: s.songName,
				...(s.duration
					? {
							duration: s.duration,
						}
					: {}),
			},
		}));
		// Need to make sure it's not over the max payload size (1000)
		const chunkSize = 500;
		for (let i = 0; i < entries.length; i += chunkSize) {
			const dto = {
				listen_type: "import",
				payload: entries.slice(i, i + chunkSize),
			};
			try {
				await this._request(
					"/1/submit-listens",
					dto,
					"POST",
					userSettings,
				);
			} catch (e) {
				if (i === 0) {
					throw e;
				}
				return scrobbles[i].playedAt;
			}
		}
		return scrobbles.at(-1)!.playedAt;
	}

	public async _request(
		route: string,
		data: any | undefined,
		method: "GET" | "POST",
		{ userToken, instanceUrl }: PrismaJson.ListenBrainzData,
	) {
		const host = instanceUrl?.endsWith("/")
			? instanceUrl.slice(0, -1)
			: instanceUrl || "https://api.listenbrainz.org";
		try {
			const res = await this.httpService.axiosRef.request({
				url: `${host}${route}`,
				data,
				method,
				headers: {
					"User-Agent": "Meelo/0.0.1",
					Authorization: `Token ${userToken}`,
				},
			});
			return res.data;
		} catch (e) {
			this.logger.error(e.toString());
			throw new ScrobblerRequestFailedException(
				Scrobbler.ListenBrainz,
				e.toString(),
			);
		}
	}
}
