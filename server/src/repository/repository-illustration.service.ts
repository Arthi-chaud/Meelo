import FileManagerService from "src/file-manager/file-manager.service";
import { IllustrationFolderPath, IllustrationPath } from "src/illustration/models/illustration-path.model";
import { join } from 'path';

/**
 * Illustration Service dedicated to a reposiory
 */
export default abstract class RepositoryIllustrationService<
	GetByIdentifierParams extends any[],
	GetByWhereParams extends Record<any, any>
> {
	constructor(
		protected fileManagerService: FileManagerService
	) {}

	/**
	 * From an entity's identifiers, build its illustration folder path
	 * It does not check if the directory exists
	 */
	abstract buildIllustrationFolderPath(...args: GetByIdentifierParams): IllustrationPath;
	async getIllustrationFolderPath(where: GetByWhereParams): Promise<IllustrationPath> {
		return this.formatWhereInputToIdentifiers(where)
			.then((args) => this.buildIllustrationFolderPath(...args));
	}

	/**
	 * From an entity's identifiers, build its illustration path
	 * It does not check if the illustration exists
	 */
	buildIllustrationPath(...args: GetByIdentifierParams): IllustrationFolderPath {
		return join(
			this.buildIllustrationFolderPath(...args),
			'cover.jpg'
		);
	}

	async getIllustrationPath(where: GetByWhereParams): Promise<IllustrationFolderPath> {
		return this.formatWhereInputToIdentifiers(where)
			.then((args) => this.buildIllustrationPath(...args));
	}

	/**
	 * Checks if the illustration for a resource exists
	 */
	illustrationExists(illustrationPath: IllustrationPath): boolean {
		return this.fileManagerService.fileExists(illustrationPath);
	}

	/**
	 * Deletes the entity's illustration, if it exists
	 */
	deleteIllustration(illustrationPath: IllustrationPath): void {
		if (this.illustrationExists(illustrationPath)) {
			this.fileManagerService.deleteFile(illustrationPath);
		}
	}

	/**
	 * Deletes the entity's illustration folder, if it exists
	 */
	deleteIllustrationFolder(illustrationDirectoryPath: IllustrationFolderPath): void {
		if (this.fileManagerService.folderExists(illustrationDirectoryPath)) {
			this.fileManagerService.deleteFolder(illustrationDirectoryPath);
		}
	}

	/**
	 * Gets the URL to the release's illustration.
	 * If there is no illustration, it will return null
	 */
	abstract getIllustrationLink(where: GetByWhereParams): Promise<string | null>;

	/**
	 * Uses WhereInput into build parameters for the other methods
	 */
	abstract formatWhereInputToIdentifiers(
		where: GetByWhereParams
	): Promise<GetByIdentifierParams>;
}
