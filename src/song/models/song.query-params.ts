import { Slug } from "src/slug/slug"
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one"

/**
 * Query paraeters to find a song
 */
export type SongWhereInput = RequireOnlyOne<{
	byId: { id: number },
	bySlug: { slug: Slug, artistSlug: Slug }
}>;

/**
 * Query params to find multiple songs
 */
export type SongsWhereInput = RequireAtLeastOne<{
	byName: RequireOnlyOne<{ exact: Slug, contains: Slug, startsWith: Slug }>
	byArtist: RequireOnlyOne<{ artistSlug?: Slug, artistId: number }>,
	byPlayCount: RequireOnlyOne<{ below: number, exact: number, moreThan: number }>,
}>;

export type SongRelationInclude = Partial<{
	instances: boolean,
	artist: boolean
}>;