import { AlbumType } from "@prisma/client";
import { ProviderMethodNotAvailableError } from "./provider.exception";
import ProviderActions from "./provider-actions";
import ProvidersSettings from "./models/providers.settings";

/**
 * Abstraction of External Metadata Provider
 */
export default abstract class IProvider<SettingsType> implements ProviderActions {
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
	 * @returns the provider's Identifer of the artist.
	 * @param artistName Name of the artist
	 * @param songName can be used to differentiate artists with same name
	 */
	getArtistIdentifier(artistName: string, songName?: string): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the provider's Identifer of the song.
	 * @param songName The name of the song
	 * @param artistName Name of the artist
	 */
	getSongIdentifier(songName: string, artistName: string): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the provider's Identifer of the album.
	 * @param albumName The name of the album
	 * @param artistName Name of the artist, if there is one
	 */
	getAlbumIdentifier(albumName: string, artistName?: string): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the type of an album.
	 * @param albumIdentifer The identifer of the album
	 */
	getAlbumType(albumIdentifer: string): Promise<AlbumType> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the URL from the Provider of the artist's illustration
	 * @param artistIdentifer The identifier provided by `getArtistIdentifier`
	 */
	getArtistIllustrationUrl(artistIdentifer: string): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the lyrics of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongLyrics(songIdentifier: string): Promise<string> {
		throw new ProviderMethodNotAvailableError(this.name);
	}

	/**
	 * @returns the genres of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongGenres(songIdentifier: string): Promise<string[]> {
		throw new ProviderMethodNotAvailableError(this.name);
	}
}
