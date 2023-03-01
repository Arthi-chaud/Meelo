import { AlbumType } from "@prisma/client";

/**
 * Defines what a provider can do
 */
export default interface ProviderActions {
	/**
	 * @returns the provider's Identifer of the artist.
	 * @param artistName Name of the artist
	 * @param songName can be used to differentiate artists with same name
	 */
	getArtistIdentifier(artistName: string, songName?: string): Promise<string>;

	/**
	 * @returns the provider's Identifer of the song.
	 * @param songName The name of the song
	 * @param artistName Name of the artist
	 */
	getSongIdentifier(songName: string, artistName: string): Promise<string>;

	/**
	 * @returns the provider's Identifer of the album.
	 * @param albumName The name of the album
	 * @param artistName Name of the artist, if there is one
	 */
	getAlbumIdentifier(albumName: string, artistName?: string): Promise<string>;

	/**
	 * @returns the type of an album.
	 * @param albumIdentifer The identifer of the album
	 */
	getAlbumType(albumIdentifer: string): Promise<AlbumType>;

	/**
	 * @returns the URL from the Provider of the artist's illustration
	 * @param artistIdentifer The identifier provided by `getArtistIdentifier`
	 */
	getArtistIllustrationUrl(artistIdentifer: string): Promise<string>;

	/**
	 * @returns the lyrics of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongLyrics(songIdentifier: string): Promise<string>;

	/**
	 * @returns the genres of a song
	 * @param songIdentifier the identifer of the song
	 */
	getSongGenres(songIdentifier: string): Promise<string[]>;
}
