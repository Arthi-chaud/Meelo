import { AlbumRelationInclude } from "src/album/models/album.query-parameters"
import { Slug } from "src/slug/slug"
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query parameters to find one release
 */
export type ReleaseWhereInput = RequireOnlyOne<{
	byId: { id: number },
	byMasterOf: { albumId: number },
	byMasterOfNamedAlbum: { albumSlug: Slug, artistSlug?: Slug }
	bySlug: { slug: Slug, albumSlug: Slug, artistSlug?: Slug },
}>

/**
 * Query parameters to find multiple Releases
 */
export type ReleasesWhereInput = RequireOnlyOne<{
	byAlbumId: { albumId: number },
	byAlbumSlug: { albumSlug: Slug, artistSlug?: Slug },
}>

/**
 * Defines what relations to include in query
 */
export type ReleaseRelationInclude = {
	album?: boolean,
	tracks?: boolean
}