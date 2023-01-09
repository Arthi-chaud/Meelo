import { Injectable } from '@nestjs/common';
// eslint-disable-next-line no-restricted-imports
import Ffmpeg from 'fluent-ffmpeg';
import { FileDoesNotExistException } from 'src/file-manager/file-manager.exceptions';
import FileManagerService from 'src/file-manager/file-manager.service';
import * as fs from 'fs';
import * as dir from 'path';
import Logger from 'src/logger/logger';
import Metadata from 'src/metadata/models/metadata';

@Injectable()
export default class FfmpegService {
	private readonly logger = new Logger(FfmpegService.name);
	constructor(
		private fileManagerService: FileManagerService
	) {}

	/**
	 *
	 * Apply illustration to file
	 * @param illustrationPath the full path of the illustration to apply
	 * @param filePath the full path of the file to apply the illustration to
	 */
	applyIllustration(illustrationPath: string, filePath: string) {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		if (!this.fileManagerService.fileExists(illustrationPath)) {
			throw new FileDoesNotExistException(illustrationPath);
		}
		try {
			Ffmpeg(filePath)
				.addInput(illustrationPath)
				.inputOptions([
					"-map 0:V",
					"-map 0:a",
					"-map 0:s",
					"-map 1",
					"-c copy",
					"-disposition:0 attached_pic"
				]);
		} catch {
			this.logger.error(`Applying illustration to '${filePath}' failed`);
		}
	}

	/**
	 * Takes a screenshot of a video file's content
	 * @param videoPath the full path of a video file
	 * @param outPath the path to the output illustration
	 */
	takeVideoScreenshot(videoPath: string, outPath: string) {
		if (!this.fileManagerService.fileExists(videoPath)) {
			throw new FileDoesNotExistException(videoPath);
		}
		fs.mkdir(dir.dirname(outPath), { recursive: true }, () => {});
		Ffmpeg(videoPath).thumbnail({
			count: 1,
			filename: dir.basename(outPath),
			folder: dir.dirname(outPath)
		}).on('error', () => {
			this.logger.error(`Taking a screenshot of '${dir.basename(videoPath)}' failed`);
		}).on('end', () => {
			this.logger.log(`Taking a screenshot of '${dir.basename(videoPath)}' succeded`);
		});
	}

	/**
	 * Apply metadata to source file
	 * @param filePath the full path of the file to apply the metadata to
	 * @param metadata the metadata to apply
	 */
	applyMetadata(filePath: string, metadata: Metadata) {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		const tmpOutput = `temp-${filePath}`;
		const ffmpegTags: [string, string | undefined | null][] = [
			["artist", metadata.artist],
			["album_artist", metadata.albumArtist],
			["album", metadata.release],
			["title", metadata.name],
			["date", metadata.releaseDate?.getFullYear().toString()],
			["track", metadata.index?.toString()],
			["disc", metadata.discIndex?.toString()],
			["genre", metadata.genres?.at(0)],
		];

		try {
			Ffmpeg(filePath)
				.inputOptions([
					"-map 0",
					"-map_metadata 0",
					"-c copy",
					...ffmpegTags.map(
						([tag, value]) => `-metadata '${tag}'='${value?.toString()}'`
					)
				])
				.output(tmpOutput)
				.on('end', () => this.logger.error(`Applying metadata on file '${filePath}' successed`))
				.save(tmpOutput);
			fs.rename(tmpOutput, filePath, () => {});
		} catch {
			this.logger.error(`Applying metadata on file '${filePath}' failed`);
		}
	}
}
