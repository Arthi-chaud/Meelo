import { Slug } from "src/slug/slug"
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query parameters to find one album
 */
export type AlbumWhereInput = RequireOnlyOne<{
	byId: { id: number },
	bySlug: { slug: Slug, artistSlug?: Slug }
}>;

/**
 * Query parameters to find multiple albums
 */
export type AlbumsWhereInput = RequireAtLeastOne<{
	byArtist: { artistSlug?: Slug },
	byName: { startsWith: Slug, contains: Slug }
	byLibrarySource: { libraryId: number },
}>;

/**
 * Defines what relations to include in query
 */
export type AlbumRelationInclude = Partial<{
	releases: boolean,
	artist: boolean
}>;