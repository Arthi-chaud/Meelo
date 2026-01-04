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
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { MeeloException } from "src/exceptions/meelo-exception";
import Logger from "src/logger/logger";
import { Scrobbler } from "src/prisma/generated/client";
import PrismaService from "src/prisma/prisma.service";
import ScrobblersResponse from "./models/scrobblers.response";
import {
	EnablingScrobblerFailedException,
	ScrobblerDisabledException,
} from "./scrobbler.exceptions";
import LastFMScrobbler from "./scrobblers/lastfm.scrobbler";
import ListenBrainzScrobbler from "./scrobblers/listenbrainz.scrobbler";
import IScrobbler, { ScrobbleData } from "./scrobblers/scrobbler";

@Injectable()
export default class ScrobblerService {
	private readonly logger: Logger = new Logger(ScrobblerService.name);
	protected scrobblers: IScrobbler[];
	constructor(
		private prismaService: PrismaService,
		httpService: HttpService,
	) {
		this.scrobblers = [];
		for (const scrobbler of [LastFMScrobbler, ListenBrainzScrobbler]) {
			try {
				this.scrobblers.push(scrobbler.init(process.env, httpService));
			} catch (err) {
				this.logger.warn((err as MeeloException).message);
			}
		}
		if (this.scrobblers.length) {
			this.logger.log(
				`Enabled scrobblers: ${this.scrobblers.map((s) => s.name)}`,
			);
		} else {
			this.logger.warn("No scrobblers are enabled");
		}
	}

	async enableLastFM(userId: number, token: string) {
		const lastfm = this._getScrobblerOrThrow<LastFMScrobbler>(
			Scrobbler.LastFM,
		);
		const sessionToken = await lastfm.getSessionToken(token);
		await this.prismaService.userScrobbler.upsert({
			create: {
				userId,
				data: { sessionToken },
				scrobbler: Scrobbler.LastFM,
			},
			update: { data: { sessionToken } },
			where: {
				scrobbler_userId: { scrobbler: Scrobbler.LastFM, userId },
			},
		});
	}

	getLastFMUserTokenUrl(callbackUrl: string) {
		const lastfm = this._getScrobblerOrThrow<LastFMScrobbler>(
			Scrobbler.LastFM,
		);

		return lastfm.getUserTokenUrl(callbackUrl);
	}

	async disableScrobbler(userId: number, scrobbler: Scrobbler) {
		await this.prismaService.userScrobbler
			.delete({
				where: { scrobbler_userId: { scrobbler, userId } },
			})
			.catch(() => {});
	}

	async enableListenBrainz(
		userId: number,
		token: string,
		instanceUrl: string | null,
	) {
		const listenbrainz = this._getScrobblerOrThrow<ListenBrainzScrobbler>(
			Scrobbler.ListenBrainz,
		);
		const isValid = await listenbrainz
			.validateToken(token, instanceUrl)
			.catch((e) => {
				throw new EnablingScrobblerFailedException(
					Scrobbler.ListenBrainz,
					e.toString(),
				);
			});
		if (!isValid) {
			throw new EnablingScrobblerFailedException(
				Scrobbler.ListenBrainz,
				"Token is not valid",
			);
		}
		await this.prismaService.userScrobbler.upsert({
			create: {
				userId,
				data: { userToken: token, instanceUrl },
				scrobbler: Scrobbler.ListenBrainz,
			},
			update: { data: { userToken: token, instanceUrl } },
			where: {
				scrobbler_userId: { scrobbler: Scrobbler.ListenBrainz, userId },
			},
		});
	}

	async getScrobblersForUser(userId: number): Promise<ScrobblersResponse> {
		const connected = (
			await this.prismaService.userScrobbler.findMany({
				where: { userId },
			})
		).map((s) => s.scrobbler);
		const available = this.scrobblers
			.map((s) => s.name)
			.filter((sName) => !connected.includes(sName));

		return { available, connected };
	}

	@Cron(CronExpression.EVERY_5_MINUTES)
	async pushScrobbles() {
		for (const scrobbler of this.scrobblers) {
			await this.pushScrobblesForScrobbler(scrobbler).catch(() => {});
		}
	}

	private async pushScrobblesForScrobbler<T = any>(scrobbler: IScrobbler<T>) {
		const userScrobblers = await this.prismaService.userScrobbler.findMany({
			where: { scrobbler: scrobbler.name },
		});
		for (const userScrobbler of userScrobblers) {
			const lastUpdateTime = userScrobbler.lastScrobblingDate;
			// Skipping through the song service to do only one query per scrobbler
			const scrobblesToPush =
				await this.prismaService.playHistory.findMany({
					select: {
						playedAt: true,
						song: {
							select: {
								artist: { select: { name: true } },
								name: true,
								master: {
									select: {
										duration: true,
										release: {
											select: {
												album: {
													select: {
														name: true,
													},
												},
											},
										},
									},
								},
							},
						},
					},
					where: {
						userId: userScrobbler.userId,
						playedAt: lastUpdateTime
							? { gt: lastUpdateTime }
							: undefined,
					},
					orderBy: { playedAt: "asc" },
				});
			if (!scrobblesToPush.length) {
				return;
			}
			const scrobbleData: ScrobbleData[] = scrobblesToPush.map(
				(scrobble) => ({
					playedAt: scrobble.playedAt,
					songName: scrobble.song.name,
					duration: scrobble.song.master?.duration ?? null,
					artistName: scrobble.song.artist.name,
				}),
			);
			try {
				const lastScrobbleDate = await scrobbler.pushScrobbles(
					scrobbleData,
					userScrobbler.data as T,
				);
				// Setting the 'updated' date to the last scrobble, to avoid scrobble that could happen during the push
				await this.prismaService.userScrobbler.update({
					where: {
						scrobbler_userId: {
							userId: userScrobbler.userId,
							scrobbler: userScrobbler.scrobbler,
						},
					},
					data: { lastScrobblingDate: lastScrobbleDate },
				});
			} catch {
				this.logger.error("Pushing scrobbles failed");
			}
		}
	}

	protected _getScrobblerOrThrow<I extends IScrobbler>(
		scrobber: Scrobbler,
	): I {
		const scrobblerService = this.scrobblers.find(
			(s) => s.name === scrobber,
		);
		if (!scrobblerService) {
			throw new ScrobblerDisabledException(scrobber);
		}
		return scrobblerService as I;
	}
}
