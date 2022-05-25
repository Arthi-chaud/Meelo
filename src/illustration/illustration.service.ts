import { Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { Slug } from 'src/slug/slug';
import { NoIllustrationException, NoIllustrationFolderException } from './illustration.exceptions';

@Injectable()
export class IllustrationService {
	public readonly illustrationFolderPath: string;
	constructor(
		private metadataService: MetadataService,
		private fileManagerService: FileManagerService) {
		this.illustrationFolderPath = this.metadataService.metadataFolderPath;
	}

	/**
	 * From an artist's slug, return its illustration ('Profile picture') path
	 * Throws an exception if the artist does not have a metadata folder, or an illustration
	 * @param artistSlug The slug of an artist
	 */
	getArtistIllustrationPath(artistSlug: Slug): string {
		const artistMetadataFolder: string = `${this.illustrationFolderPath}/${artistSlug}`;
		if (!this.fileManagerService.folderExists(artistMetadataFolder)) {
			throw new NoIllustrationFolderException(artistSlug);
		}
		const artistIllustrationPath = `${artistMetadataFolder}/cover.jpg`;
		if (!this.fileManagerService.fileIsReadable(artistIllustrationPath))
			throw new NoIllustrationException(artistSlug);
		return artistIllustrationPath;
	}
}
