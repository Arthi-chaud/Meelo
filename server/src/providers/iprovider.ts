import { AlbumType } from "@prisma/client";
import { ProviderMethodNotAvailableError } from "./provider.exception";
import ProviderActions from "./provider-actions";
import ProvidersSettings from "./models/providers.settings";

/**
 * Abstraction of External Metadata Provider
 */
export default abstract class IProvider<SettingsType, IdentifierType = string> implements ProviderActions<IdentifierType> {
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
	 * @returns the provider's Identifer of the artist.
	 * @param artistName Name of the artist
	 * @param songName can be used to differentiate artists with same name
	 */
	getArtistIdentifier(_artistName: string, _songName?: string): Promise<IdentifierType> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns The URL to the provider's web page of the artist
	 * @param artistIdentifier provider's identifier for the artist
	 */
	getArtistURL(_artistIdentifier: IdentifierType): string {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the provider's Identifer of the song.
	 * @param songName The name of the song
	 * @param _artistIdentifier Identifier of the artist
	 */
	getSongIdentifier(
		_songName: string,
		_artistIdentifier: IdentifierType
	): Promise<IdentifierType> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns The URL to the provider's web page of the song
	 * @param songIdentifier provider's identifier for the song
	 */
	getSongURL(_songIdentifier: IdentifierType): string {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the provider's Identifer of the album.
	 * @param albumName The name of the album
	 * @param artistIdentifier Name of the artist, if there is one
	 */
	getAlbumIdentifier(
		_albumName: string, _artistIdentifier?: IdentifierType
	): Promise<IdentifierType> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns The URL to the provider's web page of the album
	 * @param albumIdentifier provider's identifier for the album
	 */
	getAlbumURL(_albumIdentifier: IdentifierType): string {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the provider's Identifer of the release.
	 * @param releaseIdentifier The ID of the release
	 */
	getReleaseURL(
		_releaseIdentifier: IdentifierType
	): string {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the type of an album.
	 * @param albumIdentifer The identifer of the album
	 */
	getAlbumType(_albumIdentifer: IdentifierType): Promise<AlbumType> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns A short description of the album
	 * @param albumIdentifer The identifier of the album
	 */
	getAlbumDescription(_albumIdentifer: IdentifierType): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the URL from the Provider of the artist's illustration
	 * @param artistIdentifer The identifier provided by `getArtistIdentifier`
	 */
	getArtistIllustrationUrl(_artistIdentifer: IdentifierType): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns A short description of the artist
	 * @param artistIdentifer The identifier of the artist
	 */
	getArtistDescription(_artistIdentifer: IdentifierType): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the lyrics of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongLyrics(_songIdentifier: IdentifierType): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the genres of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongGenres(_songIdentifier: IdentifierType): Promise<string[]> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the description of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongDescription(_songIdentifier: IdentifierType): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}
}
