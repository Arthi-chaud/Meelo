
/**
 * Extracted metadata from a track file
 */
export interface Metadata {
	/**
	 * Name of the artist of the track
	 */
	artist?: string;

	/**
	 * Name of the artist of the parent album
	 */
	albumArtist?: string;

	/**
	 * Name of the album of the track
	 */
	album?: string;

	/**
	 * Name of the release of the track
	 */
	release?: string;

	/**
	 * Name of the track 
	 */
	name?: string;

	/**
	 * Release date of the track
	 */
	releaseDate?: Date;
	/**
	 * Index of the track on the disc
	 */
	index?: number;

	/**
	 * Index of the disc the track is on
	 */
	discIndex?: number;

	/**
	 * Bitrate of the file
	 */
	bitrate?: number;

	/**
	 * Duration in seconds of the track
	 */
	duration?: number;
	/**
	 * Type of the track
	 */
	type?: TrackType;
}