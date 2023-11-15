import {
	AlbumExternalId, ArtistExternalId,
	ReleaseExternalId, SongExternalId
} from "@prisma/client";
import { ProviderMethodNotAvailableError } from "./provider.exception";
import ProvidersSettings from "./models/providers.settings";

export type ArtistMetadata = Omit<ArtistExternalId, 'id' | 'providerId' | 'artistId'>
export type AlbumMetadata = Omit<AlbumExternalId, 'id' | 'providerId' | 'albumId'>
export type SongMetadata = Omit<SongExternalId, 'id' | 'providerId' | 'songId'>
export type ReleaseMetadata = Omit<ReleaseExternalId, 'id' | 'providerId' | 'releaseId'>

type IdentifierType = string;

/**
 * Abstraction of External Metadata Provider
 */
export default abstract class IProvider<SettingsType = unknown> {
	constructor(
		/**
		 * Name of the Provider, used to identify it in the database and the settings
		 */
		public readonly name: keyof ProvidersSettings
	) { }

	protected _settings: SettingsType;

	set settings(settings: SettingsType) {
		this._settings = settings;
	}

	/**
	 * The URL to get the provider's Banner
	 */
	abstract getProviderBannerUrl(): string;

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
		_artistIdentifier: IdentifierType
	): Promise<ArtistMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getAlbumMetadataByName(_artistName: string, _albumName: string): Promise<AlbumMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getAlbumMetadataByIdentifier(_albumIdentifier: IdentifierType): Promise<AlbumMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getSongMetadataByName(_artistName: string, _songName: string): Promise<SongMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getSongMetadataByIdentifier(_songIdentifier: IdentifierType): Promise<SongMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getReleaseMetadataByName(_artistName: string, _releaseName: string): Promise<ReleaseMetadata> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	getReleaseMetadataByIdentifier(_releaseIdentifier: IdentifierType): Promise<ReleaseMetadata> {
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

	/**
	 * @returns the URL from the Provider of the artist's illustration
	 * @param artistIdentifer The identifier provided by `getArtistIdentifier`
	 */
	getArtistIllustrationUrl(_artistIdentifer: IdentifierType): Promise<string> {
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
