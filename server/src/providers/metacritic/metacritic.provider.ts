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
import MetacriticSettings from "./metacritic.settings";
import { HttpService } from "@nestjs/axios";
import { ProviderActionFailedError } from "../provider.exception";
import { isNumber } from "class-validator";
import * as cheerio from "cheerio";
import SettingsService from "src/settings/settings.service";

@Injectable()
export default class MetacriticProvider
	extends IProvider<MetacriticSettings>
	implements OnModuleInit
{
	constructor(
		private readonly httpService: HttpService,
		private settingsService: SettingsService,
	) {
		super("metacritic");
	}

	onModuleInit() {
		this._settings =
			this.settingsService.settingsValues.providers.metacritic;
	}

	getProviderHomepage(): string {
		return "https://www.metacritic.com";
	}

	getProviderBannerUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/4/48/Metacritic_logo.svg";
	}

	getProviderIconUrl(): string {
		return "https://iconape.com/wp-content/files/hk/120653/png/Metacritic_logo_original.png";
	}

	getAlbumWikidataIdentifierProperty() {
		return "P1712";
	}

	getAlbumURL(albumIdentifier: string): string {
		return `${this.getProviderHomepage()}/${albumIdentifier}`;
	}

	async getAlbumMetadataByIdentifier(
		albumIdentifier: string,
	): Promise<AlbumMetadata> {
		try {
			const albumPage = await this.httpService.axiosRef
				.get(`/${albumIdentifier}`, {
					baseURL: this.getProviderHomepage(),
				})
				.then((res) => res.data);
			const pageSkeleton = cheerio.load(albumPage);
			const score = parseInt(
				pageSkeleton('span[itemprop="ratingValue"]').first().text(),
			);
			const description = pageSkeleton("span[itemprop=description]")
				.first()
				.text();

			return {
				value: albumIdentifier,
				rating: isNumber(score) ? score : null,
				description: description ?? null,
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
