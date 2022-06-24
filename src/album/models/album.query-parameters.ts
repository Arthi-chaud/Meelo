import { Slug } from "src/slug/slug"
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query parameters to find one album
 */
export type AlbumWhereInput = RequireOnlyOne<{
	byId: { id: number },
	bySlug: { slug: Slug, artistSlug?: Slug }
}>

/**
 * Query parameters to find multiple albums
 */
export type AlbumsWhereInput = RequireOnlyOne<{
	byArtist: { artistSlug?: Slug },
	byLibrarySource: { libraryId: number },
}>

/**
 * Defines what relations to include in query
 */
export type AlbumRelationInclude = {
	releases?: boolean,
	artist?: boolean
}