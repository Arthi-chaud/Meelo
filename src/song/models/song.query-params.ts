import { Album, Song } from "@prisma/client";
import { ArtistQueryParameters } from "src/artist/models/artist.query-parameters";
import { Slug } from "src/slug/slug"
import { OmitId } from "src/utils/omit-id";
import { OmitReleaseDate } from "src/utils/omit-release-date";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"
import { SearchStringInput } from "src/utils/search-string-input";


export namespace SongQueryParameters {
	type OmitArtistId<T> = Omit<T, 'artistId'>;
	type OmitPlayCount<T> = Omit<T, 'playCount'>;
	/**
	 * The input required to save a song in the database
	 */
	export type CreateInput = OmitPlayCount<OmitReleaseDate<OmitId<OmitArtistId<Song>>>>
		& { releaseDate?: Date }
		& { artist?: ArtistQueryParameters.WhereInput };
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
	 * Query paraeters to find a song
	 */
	export type WhereInput = RequireOnlyOne<{
		byId: { id: number },
		bySlug: { slug: Slug, artist?: ArtistQueryParameters.WhereInput }
	}>;

	/**
	 * Query params to find multiple songs
	 */
	export type ManyWhereInput = RequireAtLeastOne<{
		name: SearchStringInput,
		artist?: ArtistQueryParameters.WhereInput,
		playCount: RequireOnlyOne<{ below: number, exact: number, moreThan: number }>,
	}>;
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