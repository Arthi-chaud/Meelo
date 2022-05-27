
/**
 * Extracted metadata from a track file
 */
export interface Metadata {
	/**
	 * Name of the artist of the track
	 */
	artist: string | null;

	/**
	 * Name of the artist of the parent album
	 */
	albumArtist: string | null;

	/**
	 * Name of the album of the track
	 */
	album: string | null;

	/**
	 * Name of the release of the track
	 */
	release: string | null;

	/**
	 * Name of the track 
	 */
	name: string | null;

	/**
	 * Release date of the track
	 */
	releaseDate: Date | null;
	/**
	 * Index of the track on the disc
	 */
	index: number | null;

	/**
	 * Index of the disc the track is on
	 */
	discIndex: number | null;

	/**
	 * Bitrate of the file
	 */
	bitrate: number | null;

	/**
	 * Duration in seconds of the track
	 */
	duration: number | null;
}