import Illustration from "./illustration";
import Resource from "./resource";
import * as yup from 'yup';
import Song from "./song";

const PlaylistEntry = Song.concat(yup.object({
	/**
	 * The identifier of the entry
	 */
	entryId: yup.number().required()
}));

const Playlist = Resource.concat(Illustration).concat(yup.object({
	/**
	 * The name of the playlist
	 */
	name: yup.string().required(),
	/**
	 * Slug of the name
	 * Also an identifier of the playlist
	 */
	slug: yup.string().required(),
	/**
	 * the date the playlist was created
	 */
	createdAt: yup.date().required()
}));

type Playlist = yup.InferType<typeof Playlist>;

export type PlaylistInclude = 'entries';

const PlaylistWithRelations = <Selection extends PlaylistInclude | never = never>(
	relation: Selection[]
) => Playlist.concat(yup.object({
		entries: yup.array(PlaylistEntry.required()).required()
	}).pick(relation));

type PlaylistWithRelations<Selection extends PlaylistInclude | never = never> =
	yup.InferType<ReturnType<typeof PlaylistWithRelations<Selection>>>

export default Playlist;

export const PlaylistSortingKeys = [
	'name',
	'entryCount',
	'creationDate'
] as const;

export { PlaylistWithRelations };
