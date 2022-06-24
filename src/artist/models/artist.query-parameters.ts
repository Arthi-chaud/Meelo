import { Slug } from "src/slug/slug"
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query parameters to find one artist
 */
export type ArtistWhereInput = RequireOnlyOne<{
	byId: { id: number },
	bySlug: { slug: Slug }
}>

/**
 * Query parameters to find multiple artists
 */
export type ArtistsWhereInput = RequireOnlyOne<{
	byLibrarySource: { libraryId: number },
	bySlug: RequireOnlyOne<{ startsWith: string, contains: string }>
}>

/**
 * Defines what relations to include in query
 */
export type ArtistRelationInclude = {
	albums?: boolean,
	songs?: boolean
}