import type { Lyrics } from "src/prisma/models";
import type SongQueryParameters from "src/song/models/song.query-params";
import type { RequireExactlyOne } from 'type-fest';
import type { RelationInclude as BaseRelationInclude } from 'src/relation-include/models/relation-include';
import { filterAtomicRelationInclude } from "src/relation-include/atomic-relation-include.filter";

namespace LyricsQueryParameters {
	/**
	 * Parameters required to create a Lyric entry
	 */
	export type CreateInput = Omit<Lyrics, 'id' | 'song'>
	/**
	 * Query parameters to find one lyric entry
	 */
	export type WhereInput = RequireExactlyOne<Omit<Lyrics, 'songId'  | 'song' | 'content'> & {
		song: SongQueryParameters.WhereInput
	}>;

	/**
	 * Query parameters to find multiple lyric entry
	 */
	export type ManyWhereInput = Partial<{
		bySongs: SongQueryParameters.ManyWhereInput
	}>;

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
	export const AvailableAtomicIncludes = filterAtomicRelationInclude(AvailableIncludes);
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	
}

export default LyricsQueryParameters;