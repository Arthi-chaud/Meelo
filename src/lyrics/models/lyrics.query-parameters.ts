import type { Lyrics, Prisma } from "@prisma/client";
import SongQueryParameters from "src/song/models/song.query-params";
import type OmitId from "src/utils/omit-id";
import type RequireOnlyOne from "src/utils/require-only-one";
import type { RelationInclude as BaseRelationInclude } from 'src/relation-include/models/relation-include';
import ParseBaseRelationIncludePipe from "src/relation-include/relation-include.pipe";

namespace LyricsQueryParameters {
	/**
	 * Parameters required to create a Lyric entry
	 */
	export type CreateInput = OmitId<Omit<Lyrics, 'songId'>> & {
		song: SongQueryParameters.WhereInput
	};
	/**
	 * Query parameters to find one lyric entry
	 */
	export type WhereInput = RequireOnlyOne<Omit<Omit<Lyrics, 'songId'>, 'content'> & {
		song: SongQueryParameters.WhereInput
	}>;

	/**
	 * Build the query parameters for ORM, to select one lyric entry
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput): Prisma.LyricsWhereInput {
		return {
			id: where.id,
			song: where.song ?
				SongQueryParameters.buildQueryParametersForOne(where.song)
			: undefined,
		}
	}

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
	export type DeleteInput = RequireOnlyOne<Omit<Lyrics, 'content'>>;

	/**
	 * Defines what relations to include in query
	 */
	export const AvailableIncludes = ['song'] as const;
	export type RelationInclude = BaseRelationInclude<typeof AvailableIncludes>;
	export const ParseRelationIncludePipe = new ParseBaseRelationIncludePipe(AvailableIncludes);

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	 export function buildIncludeParameters(include?: RelationInclude) {
		return {
			song: include?.song ?? false
		};
	}
}

export default LyricsQueryParameters;