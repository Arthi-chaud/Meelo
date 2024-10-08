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

import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider, { AlbumMetadata } from "../iprovider";
import AllMusicSettings from "./allmusic.settings";
import { HttpService } from "@nestjs/axios";
import { ProviderActionFailedError } from "../provider.exception";
import { isNumber } from "class-validator";
import * as cheerio from "cheerio";
import SettingsService from "src/settings/settings.service";

@Injectable()
export default class AllMusicProvider
	extends IProvider<AllMusicSettings>
	implements OnModuleInit
{
	constructor(
		private readonly httpService: HttpService,
		private settingsService: SettingsService,
	) {
		super("allMusic");
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/AllMusic_Logo.svg/187px-AllMusic_Logo.svg.png";
	}

	onModuleInit() {
		this._settings = this.settingsService.settingsValues.providers.allMusic;
	}

	getProviderHomepage(): string {
		return "https://www.allmusic.com";
	}

	getAlbumWikidataIdentifierProperty() {
		return "P1729";
	}

	getMusicBrainzRelationKey(): string | null {
		return "allmusic";
	}

	parseAlbumIdentifierFromUrl(url: string): string | null {
		return (
			url.match(/(https:\/\/www\.)?allmusic\.com\/album\/(?<ID>mw\d+)/i)
				?.groups?.["ID"] ?? null
		);
	}

	getAlbumURL(albumIdentifier: string): string {
		return `${this.getProviderHomepage()}/album/${albumIdentifier}`;
	}

	async getAlbumMetadataByIdentifier(
		albumIdentifier: string,
	): Promise<AlbumMetadata> {
		try {
			const albumPage = await this.httpService.axiosRef
				.get(`/album/${albumIdentifier}`, {
					baseURL: this.getProviderHomepage(),
				})
				.then((res) => res.data);
			const pageSkeleton = cheerio.load(albumPage);
			const ratingDiv = pageSkeleton(
				'div[title="AllMusic Rating"]',
			).first();
			const scoreOutTen = parseInt(
				(
					ratingDiv.attr("class")?.match(/ratingAllmusic\d$/)?.[0] ??
					""
				).replace("ratingAllmusic", ""),
			);
			const description = null; // Can't get description, the page uses JS to get it

			return {
				value: albumIdentifier,
				rating: isNumber(scoreOutTen)
					? scoreOutTen > 0
						? (scoreOutTen + 1) * 10
						: null
					: null,
				description: description,
			};
		} catch (err) {
			throw new ProviderActionFailedError(
				this.name,
				"getAlbumMetadataByIdentifier",
				err.message,
			);
		}
	}
}
