import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one";
/**
 * Query parameters to find one file
 */
export type FileWhereInput = RequireOnlyOne<{
	byTrack: { trackId: number }
	byId: { id: number },
	byPath: { path: string }
}>;

/**
 * Query parameters to find multiple files
 */
export type FilesWhereInput = RequireAtLeastOne<{
	byLibrary: { libraryId: number },
	byIds: { ids: number[] },
	byPaths: { paths: string[] },
	byRegistrationDate: RequireOnlyOne<{ before: Date, after: Date, on: Date }>
}>;

export type FileRelationInclude = Partial<{
	track: boolean,
	library: boolean
}>;