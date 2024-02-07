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
	AlbumExternalId,
	ArtistExternalId,
	ReleaseExternalId,
	SongExternalId,
} from "@prisma/client";
import { ProviderMethodNotAvailableError } from "./provider.exception";
import ProvidersSettings from "./models/providers.settings";

export type ArtistMetadata = Omit<
	ArtistExternalId,
	"id" | "providerId" | "artistId"
>;
export type AlbumMetadata = Omit<
	AlbumExternalId,
	"id" | "providerId" | "albumId"
> & { genres?: string[] };
export type SongMetadata = Omit<SongExternalId, "id" | "providerId" | "songId">;
export type ReleaseMetadata = Omit<
	ReleaseExternalId,
	"id" | "providerId" | "releaseId"
>;

type IdentifierType = string;

/**
 * Abstraction of External Metadata Provider
 */
export default abstract class IProvider<SettingsType = unknown> {
	constructor(
		/**
		 * Name of the Provider, used to identify it in the database and the settings
		 */
		public readonly name: keyof ProvidersSettings,
	) {}

	protected _settings: SettingsType;

	set settings(settings: SettingsType) {
		this._settings = settings;
	}

	get settings() {
		return this._settings;
	}

	/**
	 * The URL to get the provider's Icon
	 */
	abstract getProviderIconUrl(): string;

	/**
	 * The URL to get the provider's Homrpage
	 */
	abstract getProviderHomepage(): string;

	/**
	 * Retrives all the wanted metadata in one go
	 */
	getArtistMetadataByName(_artistName: string): Promise<ArtistMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getArtistMetadataByIdentifier(
		_artistIdentifier: IdentifierType,
	): Promise<ArtistMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getAlbumMetadataByName(
		_albumName: string,
		_artistName?: string,
	): Promise<AlbumMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getAlbumMetadataByIdentifier(
		_albumIdentifier: IdentifierType,
	): Promise<AlbumMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getSongMetadataByName(
		_songName: string,
		_artistIdentifier: string,
	): Promise<SongMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getSongMetadataByIdentifier(
		_songIdentifier: IdentifierType,
	): Promise<SongMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getReleaseMetadataByName(
		_releaseName: string,
		_artistName: string,
	): Promise<ReleaseMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getReleaseMetadataByIdentifier(
		_releaseIdentifier: IdentifierType,
	): Promise<ReleaseMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns The URL to the provider's web page of the resource
	 */
	getArtistURL(_artistIdentifier: IdentifierType): string | null {
		return null;
	}

	getAlbumURL(_albumIdentifer: IdentifierType): string | null {
		return null;
	}

	getSongURL(_songIdentifer: IdentifierType): string | null {
		return null;
	}

	getReleaseURL(_releaseIdentifier: IdentifierType): string | null {
		return null;
	}

	/**
	 * Indicates what is the wikidata's property ID for the provider
	 * @example A Genius' Artist ID would be property `P2373` (see https://www.wikidata.org/wiki/Q452449)
	 */
	getArtistWikidataIdentifierProperty(): string | null {
		return null;
	}

	getAlbumWikidataIdentifierProperty(): string | null {
		return null;
	}

	getSongWikidataIdentifierProperty(): string | null {
		return null;
	}

	getMusicBrainzRelationKey(): string | null {
		return null;
	}

	parseArtistIdentifierFromUrl(url: string): string | null {
		return null;
	}

	parseAlbumIdentifierFromUrl(url: string): string | null {
		return null;
	}

	parseSongIdentifierFromUrl(url: string): string | null {
		return null;
	}

	/**
	 * @returns the URL from the Provider of the artist's illustration
	 * @param artistIdentifer The identifier provided by `getArtistIdentifier`
	 */
	getArtistIllustrationUrl(
		_artistIdentifer: IdentifierType,
	): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the lyrics of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongLyrics(_songIdentifier: IdentifierType): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}
}
