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
import IProvider, {
	AlbumMetadata,
	ArtistMetadata,
	ReleaseMetadata,
} from "../iprovider";
import DiscogsSettings from "./discogs.settings";
import { HttpService } from "@nestjs/axios";
import { ProviderActionFailedError } from "../provider.exception";
import { homepage, name, version } from "package.json";
import { isNumber, isString } from "class-validator";
import SettingsService from "src/settings/settings.service";

@Injectable()
export default class DiscogsProvider
	extends IProvider<DiscogsSettings>
	implements OnModuleInit
{
	constructor(
		private readonly httpService: HttpService,
		private settingsService: SettingsService,
	) {
		super("discogs");
	}

	onModuleInit() {
		this.settings = this.settingsService.settingsValues.providers.discogs;
	}

	getProviderHomepage(): string {
		return "https://www.discogs.com";
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Discogs_record_icon.svg/240px-Discogs_record_icon.svg.png";
	}

	getArtistURL(artistIdentifier: string): string {
		return `${this.getProviderHomepage()}/artist/${artistIdentifier}`;
	}

	getAlbumURL(albumIdentifier: string): string {
		return `${this.getProviderHomepage()}/master/${albumIdentifier}`;
	}

	getReleaseURL(releaseIdentifier: string): string {
		return `${this.getProviderHomepage()}/release/${releaseIdentifier}`;
	}

	async getArtistMetadataByIdentifier(
		artistIdentifier: string,
	): Promise<ArtistMetadata> {
		try {
			const artist = await this.fetch(`/artists/${artistIdentifier}`);

			if (isNumber(artist.id) && isString(artist.profile_plaintext)) {
				return {
					value: artist.id.toString(),
					illustration: artist.images.at(0)?.uri ?? null,
					description: artist.profile_plaintext,
				};
			}
			throw new ProviderActionFailedError(
				this.name,
				"getArtistMetadataByIdentifier",
				"Invalid Data Type",
			);
		} catch (e) {
			throw new ProviderActionFailedError(
				this.name,
				"getArtistMetadataByIdentifier",
				"Artist Not Found",
			);
		}
	}

	async getAlbumMetadataByIdentifier(
		masterIdentifier: string,
	): Promise<AlbumMetadata> {
		try {
			const album = await this.fetch(`/masters/${masterIdentifier}`);

			if (isNumber(album.id) && isString(album.notes_plaintext)) {
				return {
					genres: album.genres,
					value: album.id.toString(),
					rating: null,
					description: album.notes_plaintext,
				};
			}
			throw new ProviderActionFailedError(
				this.name,
				"getAlbumMetadataByIdentifier",
				"Invalid Data Type",
			);
		} catch {
			throw new ProviderActionFailedError(
				this.name,
				"getAlbumMetadataByIdentifier",
				"Album Not Found",
			);
		}
	}

	async getReleaseMetadataByIdentifier(
		releaseIdentifier: string,
	): Promise<ReleaseMetadata> {
		try {
			const release = await this.fetch(`/releases/${releaseIdentifier}`);

			if (
				isNumber(release.id) &&
				(isString(release.notes_plaintext) || isString(release.notes))
			) {
				return {
					value: release.id.toString(),
					description: release.notes_plaintext || release.notes,
				};
			}
			throw new ProviderActionFailedError(
				this.name,
				"getReleaseMetadataByIdentifier",
				"Invalid Data Type",
			);
		} catch (e) {
			throw new ProviderActionFailedError(
				this.name,
				"getReleaseMetadataByIdentifier",
				"Release Not Found",
			);
		}
	}

	getArtistWikidataIdentifierProperty() {
		return "P1953";
	}

	getAlbumWikidataIdentifierProperty() {
		return "P1954";
	}

	getMusicBrainzRelationKey(): string | null {
		return "discogs";
	}

	parseArtistIdentifierFromUrl(url: string): string | null {
		return (
			url.match(/(https:\/\/www\.)?discogs\.com\/artist\/(?<ID>\d+)/)
				?.groups?.["ID"] ?? null
		);
	}

	parseAlbumIdentifierFromUrl(url: string): string | null {
		return (
			url.match(/(https:\/\/www\.)?discogs\.com\/master\/(?<ID>\d+)/)
				?.groups?.["ID"] ?? null
		);
	}

	async fetch(route: string): Promise<any> {
		const accessToken =
			process.env.NODE_ENV == "test"
				? process.env.DISCOGS_ACCESS_TOKEN
				: this.settings.apiKey;

		try {
			return this.httpService.axiosRef
				.get(route, {
					baseURL: "https://api.discogs.com",
					params: { token: accessToken },
					headers: {
						Accept: "application/vnd.discogs.v2.plaintext+json",
						"User-Agent": `${name}/${version} +${homepage}`,
					},
				})
				.then((res) => res.data);
		} catch {
			throw new ProviderActionFailedError(
				this.name,
				"getArtistMetadataByIdentifier",
				"Artist Not Found",
			);
		}
	}
}
