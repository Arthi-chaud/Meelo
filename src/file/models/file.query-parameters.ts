import { File } from "@prisma/client";
import { OmitId } from "src/utils/omit-id";
import { RequireAtLeastOne } from "src/utils/require-at-least-one";
import { RequireOnlyOne } from "src/utils/require-only-one";

export namespace FileQueryParameters {
	/**
	 * Parameters to create a File
	 */
	 export type CreateInput = OmitId<File>;
	/**
	 * Query parameters to find one file
	 */
	export type WhereInput = RequireOnlyOne<{
		byTrack: { trackId: number }
		byId: { id: number },
		byPath: { path: string }
	}>;

	export function buildQueryParameters(where: WhereInput) {
		return {
			id: where.byId?.id,
			track: where.byTrack ? {
				id: where.byTrack.trackId
			} : undefined,
			path: where.byPath?.path,
		};
	}
	
	/**
	 * Query parameters to find multiple files
	 */
	export type ManyWhereInput = RequireAtLeastOne<{
		byLibrary: { libraryId: number },
		byIds: { ids: number[] },
		byPaths: { paths: string[] },
		byRegistrationDate: RequireOnlyOne<{ before: Date, after: Date, on: Date }>
	}>;


	export function buildQueryParametersForMany(where: ManyWhereInput) {
		return {
			id: where.byIds ? {
				in: where.byIds.ids
			} : undefined,
			libraryId: where.byLibrary?.libraryId,
			path: where.byPaths ? {
				in: where.byPaths.paths
			} : undefined,
			registerDate: where.byRegistrationDate ? 
				where.byRegistrationDate.on ? {
					gte: new Date (where.byRegistrationDate.on.setHours(0, 0, 0, 0)),
					lt: new Date (where.byRegistrationDate.on.setHours(0, 0, 0, 0) + 3600 * 24)
				} : {
					lt: where.byRegistrationDate.before,
					gt: where.byRegistrationDate.after,
				}
			: undefined
		}
	}

	/**
	 * The parameters needed to update a File
	 */
	export type UpdateInput = CreateInput;
	
	/**
	 * Relations to include in returned File object
	 */
	export type RelationInclude = Partial<{
		track: boolean,
		library: boolean
	}>;

	export function buildIncludeParameters(include?: RelationInclude) {
		return {
			track: include?.track,
			library: include?.library,
		};
	}
}