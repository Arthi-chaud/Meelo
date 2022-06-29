import { Song } from "@prisma/client";
import { ArtistQueryParameters } from "src/artist/models/artist.query-parameters";
import { Slug } from "src/slug/slug"
import { OmitId } from "src/utils/omit-id";
import { OmitReleaseDate } from "src/utils/omit-release-date";
import { OmitSlug } from "src/utils/omit-slug";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"
import { buildStringSearchParameters, SearchStringInput } from "src/utils/search-string-input";


export namespace SongQueryParameters {
	type OmitArtistId<T> = Omit<T, 'artistId'>;
	type OmitPlayCount<T> = Omit<T, 'playCount'>;
	/**
	 * The input required to save a song in the database
	 */
	export type CreateInput = OmitSlug<OmitPlayCount<OmitId<OmitArtistId<Song>>>>
		& { artist: ArtistQueryParameters.WhereInput };
	
	/**
	 * Query paraeters to find a song
	 */
	export type WhereInput = RequireOnlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artist: ArtistQueryParameters.WhereInput }
	}>;
	/**
	 * Build the query parameters for ORM, to select one song
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForOne(where: WhereInput) {
		return {
			id: where.byId?.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug
				? ArtistQueryParameters.buildQueryParametersForOne(where.bySlug.artist)
				: undefined
		};
	}

	/**
	 * Query params to find multiple songs
	 */
	export type ManyWhereInput = Partial<RequireAtLeastOne<{
		name: SearchStringInput,
		artist?: ArtistQueryParameters.WhereInput,
		playCount: RequireOnlyOne<{ below: number, exact: number, moreThan: number }>,
	}>>;
	/**
	 * Build the query parameters for ORM, to select multiple rows
	 * @param where the query parameter to transform for ORM
	 * @returns the ORM-ready query parameters
	 */
	export function buildQueryParametersForMany(where: ManyWhereInput) {
		return {
			artistId: where.artist?.id,
			artist: where.artist?.slug ? {
				slug: where.artist.slug.toString()
			} : undefined,
			name: buildStringSearchParameters(where.name),
			playCount: {
				equals: where.playCount?.exact,
				gt: where.playCount?.moreThan,
				lt: where.playCount?.below
			}
		};
	}

	/**
	 * The input required to update a song in the database
	 */
	export type UpdateInput = Partial<OmitId<OmitArtistId<Song>>>
		& { artist?: ArtistQueryParameters.WhereInput };
	/**
	 * The input to find or create a song
	 */
	export type GetOrCreateInput = CreateInput;
	/**
	 * Defines what relations to include in query
	 */
	export type RelationInclude = Partial<{
		instances: boolean,
		artist: boolean
	}>;

	/**
	 * Build the query parameters for ORM to include relations
	 * @returns the ORM-ready query parameters
	 */
	 export function buildIncludeParameters(include?: RelationInclude) {
		return {
			instances: include?.instances ?? false,
			artist: include?.artist ?? false
		};
	}
}