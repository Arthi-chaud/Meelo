import { Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { MetadataService } from 'src/metadata/metadata.service';
import { Release } from 'src/release/models/release.model';
import { ReleaseService } from 'src/release/release.service';
import { Slug } from 'src/slug/slug';
import { NoAlbumFolderIllustrationException, NoArtistFolderIllustrationException, NoArtistIllustrationException, NoReleaseFolderIllustrationException, NoReleaseIllustrationException } from './illustration.exceptions';

@Injectable()
export class IllustrationService {
	public readonly illustrationFolderPath: string;
	constructor(
		private metadataService: MetadataService,
		private releaseService: ReleaseService,
		private fileManagerService: FileManagerService) {
		this.illustrationFolderPath = this.metadataService.metadataFolderPath;
	}

	/**
	 * From an artist's slug, return its illustrations folder path which holds sub-directories for related albums
	 * Throws an exception if the artist does not have a metadata folder
	 * @param artistSlug The slug of an artist
	 */
	getArtistIllustrationFolderPath(artistSlug: Slug): string {
		const artistMetadataFolder: string = `${this.illustrationFolderPath}/${artistSlug}`;
		if (!this.fileManagerService.folderExists(artistMetadataFolder)) {
			throw new NoArtistFolderIllustrationException(artistSlug);
		}
		return artistMetadataFolder;
	}

	/**
	 * From an artist's slug and an album's slug, return its illustrations folder path which holds sub-directories for related albums
	 * Throws an exception if the album does not have a metadata folder
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album from the artist
	 */
	getAlbumIllustrationFolderPath(artistSlug: Slug, albumSlug: Slug): string {
		const artistMetadataFolder: string = this.getArtistIllustrationFolderPath(artistSlug);
		const albumMetadataFolder: string = `${artistMetadataFolder}/${albumSlug}`;
		if (!this.fileManagerService.folderExists(albumMetadataFolder)) {
			throw new NoAlbumFolderIllustrationException(artistSlug);
		}
		return artistMetadataFolder;
	}

	/**
	 * From an artist's slug, an album's slug and a releaseId, return the later's illustrations folder path which holds sub-directories for related albums
	 * Throws an exception if the release does not have a metadata folder
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album from the artist
	 * @param releaseId The id of a release of the album
	 */
	getReleaseIllustrationFolderPath(artistSlug: Slug, albumSlug: Slug, releaseId: number): string {
		const albumMetadataFolder: string = this.getAlbumIllustrationFolderPath(artistSlug, albumSlug);
		const releaseMetadataFolder: string = `${albumMetadataFolder}/${releaseId}`;
		if (!this.fileManagerService.folderExists(albumMetadataFolder)) {
			throw new NoReleaseFolderIllustrationException(albumSlug, releaseId);
		}
		return releaseMetadataFolder;
	}

	/**
	 * From an artist's slug, return its illustration ('Profile picture') path
	 * Throws an exception if the artist does not have an illustration
	 * @param artistSlug The slug of an artist
	 */
	getArtistIllustrationPath(artistSlug: Slug): string {
		const artistMetadataFolder: string = this.getArtistIllustrationFolderPath(artistSlug);
		const artistIllustrationPath = `${artistMetadataFolder}/cover.jpg`;
		if (!this.fileManagerService.fileIsReadable(artistIllustrationPath))
			throw new NoArtistIllustrationException(artistSlug);
		return artistIllustrationPath;
	}

	async getMasterReleaseIllustrationPath(artistSlug: Slug, albumSlug: Slug): Promise<string> {
		const masterRelease: Release = await this.releaseService.getMasterReleaseOf(albumSlug, artistSlug);
		return this.getReleaseIllustrationPath(artistSlug, albumSlug, masterRelease.id);
	}

	getReleaseIllustrationPath(artistSlug: Slug, albumSlug: Slug, releaseId: number): string {
		const releaseIllustrationFolder: string = this.getReleaseIllustrationFolderPath(artistSlug, albumSlug, releaseId);
		const releaseIllstrationPath: string = `${releaseIllustrationFolder}/cover.jpg`;
		if (!this.fileManagerService.fileIsReadable(releaseIllstrationPath))
			throw new NoReleaseIllustrationException(albumSlug, releaseId);
		return releaseIllstrationPath;
	}
}
