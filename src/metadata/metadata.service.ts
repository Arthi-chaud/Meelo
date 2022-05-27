import { Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';
import { Metadata } from './models/metadata';
import mm, { IAudioMetadata } from 'music-metadata';
import { FileNotFoundException, FileNotReadableException } from 'src/file/file.exceptions';
import { FileParsingException, PathParsingException } from './metadata.exceptions';
import { SettingsService } from 'src/settings/settings.service';

@Injectable()
export class MetadataService {
	public readonly metadataFolderPath;
	constructor(
		private settingsService: SettingsService,
		private fileManagerService: FileManagerService) {
		this.metadataFolderPath = `${this.fileManagerService.configFolderPath}/metadata`;
	}

	/**
	 * Parses a file's metadata from its embedded data and its path
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadata(filePath: string): Promise<Metadata> {
		let fileMetadata: Metadata = await this.parseMetadataFromFile(filePath);
		
		if (this.settingsService.usePathAsMetadataSource) {
			const metadataFromPath: Metadata = this.parseMetadataFromPath(filePath);
			fileMetadata.discIndex = metadataFromPath.discIndex ?? fileMetadata.discIndex;
			fileMetadata.index = metadataFromPath.index ?? fileMetadata.index;
			fileMetadata.release = metadataFromPath.release ?? fileMetadata.release;
			fileMetadata.releaseDate = metadataFromPath.releaseDate ?? fileMetadata.releaseDate;
			fileMetadata.albumArtist = metadataFromPath.albumArtist ?? fileMetadata.albumArtist;
		}
		return fileMetadata;
	}

	/**
	 * Parses a file's metadata from its embedded data
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	private async parseMetadataFromFile(filePath: string): Promise<Metadata> {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileNotFoundException(filePath);
		}
		if (!this.fileManagerService.fileIsReadable(filePath)) {
			throw new FileNotReadableException(filePath);
		}
		try {
			const rawMetadata = await mm.parseFile(filePath, {
				duration: true,
				skipCovers: true,
				includeChapters: false,
			});
			return this.buildMetadataFromRaw(rawMetadata);
		} catch {
			throw new FileParsingException(filePath);
		}
	}

	/**
	 * Parses a File path and 
	 * @param filePath a path (full or not) to a file
	 * @returns returns Metadata object with values from the capture groups of the regex in settings file
	 */
	private parseMetadataFromPath(filePath: string): Metadata {
		try {
			let matchingRegex: RegExpMatchArray = this.settingsService.trackRegexes
				.map((regex) => filePath.match(regex))
				.find((regexMatch) => regexMatch != null)!;
			let groups = matchingRegex.groups!;
			return {
				albumArtist: groups['Artist'] ?? null,
				release: groups['Album'] ?? null,
				releaseDate: groups['Year'] ? new Date(groups['Year']) : null,
				discIndex: groups['Disc'] ? parseInt(groups['Disc']) : null,
				index: groups['Index'] ? parseInt(groups['Index']) : null,
				name: groups['Track'],
				artist: null,
				bitrate: null,
				album: null,
				duration: null
			}
		} catch {
			throw new PathParsingException(filePath);
		}
	}

	private buildMetadataFromRaw(rawMetadata: IAudioMetadata): Metadata {
		return {
			artist: rawMetadata.common.artist ?? null,
			albumArtist: rawMetadata.common.albumartist ?? null,
			album: rawMetadata.common.album ?? null,
			release: rawMetadata.common.album ?? null,
			name: rawMetadata.common.title ?? null,
			index: rawMetadata.common.track.no,
			discIndex: rawMetadata.common.disk.no,
			bitrate: rawMetadata.format.bitrate ?? null,
			duration: rawMetadata.format.duration ?? null,
			releaseDate: rawMetadata.common.date ? new Date(rawMetadata.common.date) : null
		};
	}

}
