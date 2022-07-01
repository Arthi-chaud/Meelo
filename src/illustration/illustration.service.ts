import { forwardRef, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { MetadataService } from 'src/metadata/metadata.service';
import type { Release, Track } from '@prisma/client';
import { ReleaseService } from 'src/release/release.service';
import Slug from 'src/slug/slug';
import { CantDownloadIllustrationException, IllustrationNotExtracted } from './illustration.exceptions';
import mm, { IPicture, type IAudioMetadata } from 'music-metadata';
import * as fs from 'fs';
import { FileParsingException } from 'src/metadata/metadata.exceptions';
import * as dir from 'path';
import type { IllustrationPath } from './models/illustration-path.model';
import jimp from 'jimp';
import { AlbumService } from 'src/album/album.service';
import { FileDoesNotExistException } from 'src/file-manager/file-manager.exceptions';
import { ModuleRef } from '@nestjs/core';
import compilationAlbumArtistKeyword from 'src/utils/compilation';

@Injectable()
export class IllustrationService implements OnModuleInit {
	public illustrationFolderPath: string;
	private metadataService: MetadataService;
	constructor(
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		private readonly httpService: HttpService,
		private fileManagerService: FileManagerService,
		private moduleRef: ModuleRef
	) {	}

	onModuleInit() {
		this.metadataService = this.moduleRef.get(MetadataService,  { strict: false });
		this.illustrationFolderPath = this.metadataService.metadataFolderPath;
	}

	buildCompilationIllustrationFolderPath(): string {
		return `${this.illustrationFolderPath}/${compilationAlbumArtistKeyword}`;
	}
	/**
	 * From an artist's slug, build its illustrations folder path which holds sub-directories for related albums
	 * @param artistSlug The slug of an artist
	 */
	buildArtistIllustrationFolderPath(artistSlug?: Slug): string {
		if (artistSlug == undefined)
			return this.buildCompilationIllustrationFolderPath();
		const artistMetadataFolder: string = `${this.illustrationFolderPath}/${artistSlug}`;
		return artistMetadataFolder;
	}
	/**
	 * From an artist's slug and an album's slug, build its illustrations folder path which holds sub-directories for related albums
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album from the artist
	 */
	buildAlbumIllustrationFolderPath(albumSlug: Slug, artistSlug?: Slug): string {
		const artistMetadataFolder: string = this.buildArtistIllustrationFolderPath(artistSlug);
		const albumMetadataFolder: string = `${artistMetadataFolder}/${albumSlug}`;
		return albumMetadataFolder;
	}

	/**
	 * From an artist's slug, an album's slug and a release's slug, builds the later's illustrations folder
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album from the artist
	 * @param releaseSlug The slug of a release of the album
	 */
	buildReleaseIllustrationFolderPath(albumSlug: Slug, releaseSlug: Slug, artistSlug?: Slug): string {
		const albumMetadataFolder: string = this.buildAlbumIllustrationFolderPath(albumSlug, artistSlug);
		const releaseMetadataFolder: string = `${albumMetadataFolder}/${releaseSlug.toString()}`;
		return releaseMetadataFolder;
	}

	/**
	 * From an artist's slug, return its illustration ('Profile picture') path
	 * @param artistSlug The slug of an artist
	 */
	buildArtistIllustrationPath(artistSlug?: Slug): IllustrationPath {
		const artistMetadataFolder: string = this.buildArtistIllustrationFolderPath(artistSlug);
		const artistIllustrationPath = `${artistMetadataFolder}/cover.jpg`;
		return artistIllustrationPath;
	}
	/**
	 * From an artist and an album's slug, return its master release's illustration (cover) path
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album
	 */
	async buildMasterReleaseIllustrationPath(albumSlug: Slug, artistSlug?: Slug): Promise<IllustrationPath> {
		const masterRelease: Release = await this.releaseService.getMasterRelease({
			bySlug: { slug: albumSlug, artist: artistSlug ? { slug: artistSlug } : undefined }
		});
		return this.buildReleaseIllustrationPath(albumSlug, new Slug(masterRelease.slug), artistSlug);
	}
	/**
	 * From an artist, an album, and a release's slug, return the release's illustration (cover) path
	 * @param artistSlug The slug of an artist
	 * @param albumSlug The slug of an album
	 * @param releaseSlug The slug of an release
	 */
	buildReleaseIllustrationPath(albumSlug: Slug, releaseSlug: Slug, artistSlug?: Slug): IllustrationPath {
		const releaseIllustrationFolder: string = this.buildReleaseIllustrationFolderPath(albumSlug, releaseSlug, artistSlug);
		const releaseIllstrationPath: string = `${releaseIllustrationFolder}/cover.jpg`;
		return releaseIllstrationPath;
	}

	/**
	 * Builds the illustration path of the track
	 */
	buildTrackIllustrationPath(albumSlug: Slug, releaseSlug: Slug, artistSlug?: Slug, discIndex?: number, trackIndex?: number): IllustrationPath {
		const releaseIllustrationFolder = this.buildReleaseIllustrationFolderPath(
			albumSlug,
			releaseSlug,
			artistSlug
		);
		return `${releaseIllustrationFolder}/${discIndex ? `disc-${discIndex}-` : ''}track-${trackIndex ?? 0 }/cover.jpg` 
	}

	/**
	 * Extracts the embedded illustration in a track file
	 * If no illustration is embedded, returns null
	 * If the embedded illustration is the same as the release's, nothing is done and return null
	 * If there is no release illustration, extracts the track's illustration and return its path
	 * Otherwise, if there is a release illustration, but the track's differs from it
	 * extracts the track's illustration as a track-specific illustration, and return its path
	 * @param track the track to extract the illustration from
	 */
	async extractTrackIllustration(track: Track, fullTrackPath: string): Promise<IllustrationPath | null> {
		Logger.log(`Extracting illustration from track '${track.displayName}'`);
		let release: Release = await this.releaseService.getRelease(
			{ byId: { id: track.releaseId } },
			{ album: true }
		);
		let album  = await this.albumService.getAlbum(
			{ byId: { id: release.albumId }},
			{ artist: true }
		)
		const releaseSlug = new Slug(release.slug);
		const artistSlug =  album.artist ? new Slug(album.artist.slug) : undefined;
		const albumSlug = new Slug(album.slug);
		const releaseIllustrationPath = this.buildReleaseIllustrationPath(
			albumSlug,
			releaseSlug,
			artistSlug
		);
		const trackIllustrationPath = this.buildTrackIllustrationPath(
			albumSlug,
			releaseSlug,
			artistSlug,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
		const illustration = await this.extractIllustrationFromFile(fullTrackPath);
		if (illustration == null) {
			Logger.log("No illustration to extract");
			return null;
		}
		const illustrationBytes = illustration ? (await (await jimp.read(illustration!.data)).getBufferAsync(jimp.MIME_JPEG)) : undefined;
		const saveAndGetIllustrationPath = async (illustrationPath: IllustrationPath) => {
			if (this.fileManagerService.fileExists(illustrationPath)) {
				if (this.fileManagerService.getFileContent(illustrationPath) == illustrationBytes!.toString())
					return illustrationPath;
			} else if (illustration != undefined) {
				await this.saveIllustration(illustration.data, illustrationPath);
				return illustrationPath;
			}
			return null;
		};
		const extractedIllustrationPath = await saveAndGetIllustrationPath(releaseIllustrationPath)
			?? await saveAndGetIllustrationPath(trackIllustrationPath);
		if (extractedIllustrationPath == null) {
			Logger.warn("Illustration extraction failed");
			throw new IllustrationNotExtracted(track.displayName);
		}
		Logger.log("Illustration successfully extracted");
		return extractedIllustrationPath;
	}


	/**
	 * Extracts the embedded illustration of a file
	 * @param filePath the full path to the source file to scrap
	 */
	private async extractIllustrationFromFile(filePath: string): Promise<IPicture | null> {
		let rawMetadata: IAudioMetadata;
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		try {
			rawMetadata = await mm.parseFile(filePath, {
				skipCovers: false,
			});
		} catch {
			throw new FileParsingException(filePath);
		}
		return mm.selectCover(rawMetadata.common.picture);
	}

	/**
	 * Downloads an illustration from a URL, and stores it in the illustration file system
	 * using the provided slug
	 * @param illustrationURL the full path to the source file to scrap
	 * @param outPath path to the file to save the illustration as
	 */
	async downloadIllustration(illustrationURL: string, outPath: IllustrationPath) {
		try {
			let buffer = (await this.httpService.axiosRef.get(illustrationURL)).data;
			return await this.saveIllustration(buffer, outPath);
		} catch {
			throw new CantDownloadIllustrationException(illustrationURL);
		}
	}

	/**
	 * Saves an illustration in the illustration file system
	 * @param fileContent raw binanry content of the file to save
	 * @param outPath path and name of the file to save the fileContent as
	 */
	private async saveIllustration(fileContent: Buffer, outPath: IllustrationPath) {
		let image = await jimp.read(fileContent);
		fs.mkdir(dir.dirname(outPath), { recursive: true }, function (_err) {});
		image.write(outPath);
	}
}
