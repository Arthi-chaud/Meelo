import { AlbumQueryParameters } from "src/album/models/album.query-parameters";
import { Slug } from "src/slug/slug"
import { RequireAtLeastOne } from "src/utils/require-at-least-one"
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query parameters to find one release
 */
export type ReleaseWhereInput = RequireOnlyOne<{
	byId: { id: number },
	byMasterOf: { albumId: number },
	byMasterOfNamedAlbum: { albumSlug: Slug, artistSlug?: Slug }
	bySlug: { slug: Slug, albumSlug: Slug, artistSlug?: Slug },
}>;

/**
 * Query parameters to find multiple Releases
 */
export type ReleasesWhereInput = { album: AlbumQueryParameters.WhereInput };

/**
 * Defines what relations to include in query
 */
export type ReleaseRelationInclude = Partial<{
	album: boolean,
	tracks: boolean
}>;