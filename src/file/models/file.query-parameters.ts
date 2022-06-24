import { RequireOnlyOne } from "src/utils/require-only-one";
/**
 * Query parameters to find one file
 */
export type FileWhereInput = RequireOnlyOne<{
	byTrack: { trackId: number }
	byId: { id: number },
	byPath: { path: string }
}>

/**
 * Query parameters to find multiple files
 */
export type FilesWhereInput = RequireOnlyOne<{
	byLibrary: { libraryId: number },
	byIds: { ids: number[] },
	byPaths: { paths: string[] },
	byRegistrationDate: RequireOnlyOne<{ before: Date, after: Date, on: Date }>
}>

export type FileRelationInclude = {
	track: true,
	library: true
}