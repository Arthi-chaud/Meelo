import { Slug } from "src/slug/slug"
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query parameters to find one artist
 */
export type ArtistWhereInput = RequireOnlyOne<{
	byId: { id: number },
	bySlug: { slug: Slug }
}>;

/**
 * Query parameters to find multiple artists
 */
export type ArtistsWhereInput = RequireAtLeastOne<{
	byLibrarySource: { libraryId: number },
	bySlug: RequireOnlyOne<{ startsWith: Slug, contains: Slug }>
}>;

/**
 * Defines what relations to include in query
 */
export type ArtistRelationInclude = Partial<{
	albums: boolean,
	songs: boolean
}>;