import type { Lyrics } from "@prisma/client";
import type SongQueryParameters from "src/song/models/song.query-params";
import type OmitId from "src/utils/omit-id";
import type { RequireExactlyOne } from 'type-fest';;
import type { RelationInclude as BaseRelationInclude } from 'src/relation-include/models/relation-include';
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";

namespace LyricsQueryParameters {
	/**
	 * Parameters required to create a Lyric entry
	 */
	export type CreateInput = OmitId<Lyrics>
	/**
	 * Query parameters to find one lyric entry
	 */
	export type WhereInput = RequireExactlyOne<Omit<Omit<Lyrics, 'songId'>, 'content'> & {
		song: SongQueryParameters.WhereInput
	}>;

	/**
	 * Query parameters to find multiple lyric entry
	 */
	export type ManyWhereInput = {
		bySongs: SongQueryParameters.ManyWhereInput
	};

	/**
	 * The input required to update a lyric entry in the database
	 */
	export type UpdateInput = Pick<Lyrics, 'content'>;

	/**
	 * The input to find or create a lyric entry
	 */
	export type GetOrCreateInput = CreateInput;
	
	/**
	 * Query parameters to delete one lyric entry
	 */
	export type DeleteInput = RequireExactlyOne<Omit<Lyrics, 'content'>>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['song'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);
}

export default LyricsQueryParameters;