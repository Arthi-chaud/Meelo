import Album from "./album";
import Illustration from "./illustration";
import Resource from "./resource";
import Song from "./song";

type Artist = Resource & Illustration & {
	/**
	 * The name of the artist
	 */
	name: string;
	/**
	 * Slug of the name
	 * Also an identifier of the artist
	 */
	slug: string;
}

type ArtistWithAlbums = Artist & {
	albums: Album[];
}

type ArtistWithSongs = Artist & {
	songs: Song[];
}
type ArtistInclude = never;
export default Artist;
export const ArtistSortingKeys = [
	'name',
	'albumCount',
	'songCount'
];
export type { ArtistWithSongs, ArtistWithAlbums, ArtistInclude };
