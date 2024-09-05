/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import FileManagerService from "src/file-manager/file-manager.service";
import Metadata from "./models/metadata";
import mm, { type IAudioMetadata } from "music-metadata";
import {
	FileDoesNotExistException,
	FileNotReadableException,
} from "src/file-manager/file-manager.exceptions";
import {
	BadMetadataException,
	FileParsingException,
	PathParsingException,
} from "./scanner.exceptions";
import SettingsService from "src/settings/settings.service";
import TrackService from "src/track/track.service";
import SongService from "src/song/song.service";
import { AlbumType, TrackType } from "@prisma/client";
import ReleaseService from "src/release/release.service";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import type TrackQueryParameters from "src/track/models/track.query-parameters";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import GenreService from "src/genre/genre.service";
import { File } from "src/prisma/models";
import { validate } from "class-validator";
import ParserService from "./parser.service";
import Slug from "src/slug/slug";
import escapeRegex from "src/utils/escape-regex";
import glob from "glob";
import * as dir from "path";
import mime from "mime";

@Injectable()
export default class ScannerService {
	constructor(
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
		private fileManagerService: FileManagerService,
	) {}

	/**
	 * Pushed the metadata to the database, calling services
	 * @param metadata the metadata instance to push
	 * @param file the file to register the metadata under, it must be already registered
	 * @param overwrite if true, will overwrite the existing track
	 */
	async registerMetadata(metadata: Metadata, file: File, overwrite = false) {
		const genres = await Promise.all(
			(metadata.genres ?? []).map((genre) =>
				this.genreService.getOrCreate({ name: genre }),
			),
		);
		const albumArtist = !metadata.compilation
			? await this.artistService.getOrCreate({
					name: metadata.albumArtist ?? metadata.artist!,
					registeredAt: file.registerDate,
			  })
			: undefined;
		const { name: parsedSongName, featuring: parsedFeaturingArtists } =
			await this.parserService.extractFeaturedArtistsFromSongName(
				metadata.name,
			);
		parsedFeaturingArtists.push(...(metadata.featuring ?? []));
		let parsedArtistName = metadata.artist;

		if (metadata.artist !== albumArtist?.name) {
			const { artist, featuring } =
				await this.parserService.extractFeaturedArtistsFromArtistName(
					metadata.artist,
				);

			parsedArtistName = artist;
			parsedFeaturingArtists.push(...featuring);
		}
		const songArtist = await this.artistService.getOrCreate({
			name: parsedArtistName,
			registeredAt: file.registerDate,
		});
		const featuringArtists = await Promise.all(
			parsedFeaturingArtists.map((artist) =>
				this.artistService.getOrCreate({
					name: artist,
					registeredAt: file.registerDate,
				}),
			),
		);
		const parsedTrackName =
			this.parserService.parseTrackExtensions(parsedSongName);
		const song = await this.songService.getOrCreate(
			{
				name: parsedTrackName.parsedName,
				group: {
					slug: new Slug(
						songArtist.name,
						this.parserService.stripGroups(
							parsedTrackName.parsedName,
						) || parsedTrackName.parsedName,
						// If there is no root (e.g. `(Exchange)`), `stripGroups` will return an empty string.
						// If it does, let's just pass the entire song name
					),
				},
				artist: { id: songArtist.id },
				featuring: featuringArtists.map(({ slug }) => ({
					slug: new Slug(slug),
				})),
				genres: genres.map((genre) => ({ id: genre.id })),
				registeredAt: file.registerDate,
			},
			{
				genres: true,
			},
		);

		await this.songService.update(
			{
				genres: song.genres
					.concat(genres)
					.map((genre) => ({ id: genre.id })),
			},
			{ id: song.id },
		);
		const album = await this.albumService.getOrCreate(
			{
				name: this.parserService.parseReleaseExtension(metadata.album)
					.parsedName,
				artist: albumArtist ? { id: albumArtist?.id } : undefined,
				registeredAt: file.registerDate,
			},
			{ releases: true },
		);
		const parsedReleaseName = this.parserService.parseReleaseExtension(
			metadata.release,
		);
		const release = await this.releaseService.getOrCreate(
			{
				name: parsedReleaseName.parsedName,
				extensions: parsedReleaseName.extensions,
				releaseDate: metadata.releaseDate,
				album: { id: album.id },
				registeredAt: file.registerDate,
				discogsId: metadata.discogsId,
			},
			{ album: true },
		);
		const track: TrackQueryParameters.CreateInput = {
			name: parsedTrackName.parsedName,
			isBonus: parsedTrackName.bonus,
			isRemastered: parsedTrackName.remastered,
			discIndex: metadata.discIndex ?? null,
			trackIndex: metadata.index ?? null,
			type: metadata.type,
			bitrate:
				metadata.bitrate !== undefined
					? Math.floor(metadata.bitrate)
					: null,
			ripSource: null,
			duration:
				metadata.duration !== undefined
					? Math.floor(metadata.duration)
					: null,
			sourceFile: { id: file.id },
			release: { id: release.id },
			song: { id: song.id },
		};

		if (
			albumArtist === undefined &&
			release.album.type == AlbumType.StudioRecording
		) {
			await this.albumService.update(
				{ type: AlbumType.Compilation },
				{ id: release.albumId },
			);
		}
		if (album.masterId === null) {
			this.albumService.setMasterRelease({ id: release.id });
		}
		if (
			!release.releaseDate ||
			(metadata.releaseDate && release.releaseDate < metadata.releaseDate)
		) {
			await this.releaseService.update(
				{ releaseDate: metadata.releaseDate },
				{ id: release.id },
			);
		}
		if (overwrite) {
			await this.trackService.delete({ sourceFileId: file.id });
		}
		return this.trackService.create(track).then((res) => {
			if (song.masterId === null && track.type === "Audio") {
				this.songService.setMasterTrack({ id: res.id });
			}
			return res;
		});
	}

	/**
	 * Parses a file's metadata from its embedded data and its path
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadata(filePath: string): Promise<Metadata> {
		const settings = this.settingsService.settingsValues;
		// eslint-disable-next-line init-declarations
		let metadata: Metadata;

		if (settings.metadata.order == "only") {
			if (settings.metadata.source == "path") {
				metadata = this.parseMetadataFromPath(filePath);
			} else {
				metadata = await this.parseMetadataFromFile(filePath);
			}
		} else {
			const fileMetadata: Metadata = await this.parseMetadataFromFile(
				filePath,
			);
			const pathMetadata: Metadata = this.parseMetadataFromPath(filePath);
			if (settings.metadata.source == "path") {
				metadata = this.mergeMetadata(pathMetadata, fileMetadata);
			} else {
				metadata = this.mergeMetadata(fileMetadata, pathMetadata);
			}
		}
		return this.sanitizeAndValidateMetadata(metadata);
	}

	/**
	 * Parses a file's metadata from its embedded data
	 * @param filePath the full path to a file to parse
	 * @returns a Metadata object
	 */
	async parseMetadataFromFile(filePath: string): Promise<Metadata> {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
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
	public parseMetadataFromPath(filePath: string): Metadata {
		const compArtists = [
			compilationAlbumArtistKeyword.toLowerCase(),
		].concat(
			...(this.settingsService.settingsValues.compilations.artists
				?.map((artist) => artist.toLowerCase())
				.concat(compilationAlbumArtistKeyword) ?? []),
		);

		const mimeType = mime.getType(filePath);

		if (mimeType == undefined) {
			throw new PathParsingException("Unknown MIME type");
		}
		if (!mimeType.startsWith("video/") && !mimeType.startsWith("audio/")) {
			throw new PathParsingException("Invalid MIME type");
		}
		try {
			const matchingRegex: RegExpMatchArray =
				this.settingsService.settingsValues.trackRegex
					.map((regex) => filePath.match(regex))
					.find((regexMatch) => regexMatch != null)!;
			const groups = matchingRegex.groups!;
			const isCompilation =
				compArtists.includes(
					groups["AlbumArtist"]?.toLocaleLowerCase(),
				) ||
				compArtists.includes(groups["Artist"]?.toLocaleLowerCase());

			return {
				compilation: isCompilation,
				albumArtist: isCompilation ? undefined : groups["AlbumArtist"],
				artist: groups["Artist"],
				release: groups["Release"],
				album: groups["Album"],
				releaseDate: groups["Year"]
					? new Date(groups["Year"])
					: undefined,
				discIndex: groups["Disc"]
					? parseInt(groups["Disc"])
					: undefined,
				featuring: [],
				index: groups["Index"] ? parseInt(groups["Index"]) : undefined,
				name: groups["Track"],
				genres: groups["Genre"] ? [groups["Genre"]] : [],
				discogsId: groups["DiscogsId"],
				duration: undefined,
				bitrate: undefined,
				type: mimeType.startsWith("video/")
					? TrackType.Video
					: TrackType.Audio,
			};
		} catch {
			throw new PathParsingException(filePath);
		}
	}

	private buildMetadataFromRaw(rawMetadata: IAudioMetadata): Metadata {
		const isVideo: boolean = rawMetadata.format.trackInfo.length > 1;
		const metadata = new Metadata();
		const compSettings = this.settingsService.settingsValues.compilations;

		metadata.genres = rawMetadata.common.genre ?? [];
		if (compSettings.useID3CompTag) {
			metadata.compilation = rawMetadata.common.compilation ?? false;
		} else if (metadata.albumArtist && compSettings.artists) {
			metadata.compilation = compSettings.artists
				.map((artist) => artist.toLowerCase())
				.includes(metadata.albumArtist.toLowerCase());
		} else {
			metadata.compilation = false;
		}
		metadata.artist = rawMetadata.common.artist!;
		metadata.albumArtist = metadata.compilation
			? undefined
			: rawMetadata.common.albumartist;
		metadata.album = rawMetadata.common.album!;
		metadata.release = rawMetadata.common.album!;
		metadata.name = rawMetadata.common.title!;
		metadata.index = rawMetadata.common.track.no ?? undefined;
		metadata.discIndex = rawMetadata.common.disk.no ?? undefined;
		metadata.bitrate = rawMetadata.format.bitrate
			? Math.floor(rawMetadata.format.bitrate / 1000)
			: undefined!;
		metadata.duration = rawMetadata.format.duration
			? Math.floor(rawMetadata.format.duration)
			: undefined!;
		metadata.releaseDate = rawMetadata.common.date
			? new Date(rawMetadata.common.date)
			: undefined;
		metadata.type = isVideo ? TrackType.Video : TrackType.Audio;
		return metadata;
	}

	/**
	 * Merge two metadata objects
	 * @param metadata1 the 'base' metadata. Undefined fields will be overriden by `metadata2`'s
	 * @param metadata2 the second metadata object
	 * @returns the merged metadata
	 */
	private mergeMetadata(metadata1: Metadata, metadata2: Metadata): Metadata {
		const mergedMetadata = metadata1;

		mergedMetadata.genres = (mergedMetadata.genres ?? []).concat(
			metadata2.genres ?? [],
		);
		mergedMetadata.compilation ??= metadata2.compilation;
		mergedMetadata.artist ??= metadata2.artist;
		mergedMetadata.albumArtist ??= metadata2.albumArtist;
		mergedMetadata.album ??= metadata2.album;
		mergedMetadata.release ??= metadata2.release;
		mergedMetadata.name ??= metadata2.name;
		mergedMetadata.releaseDate ??= metadata2.releaseDate;
		mergedMetadata.index ??= metadata2.index;
		mergedMetadata.discIndex ??= metadata2.discIndex;
		mergedMetadata.bitrate ??= metadata2.bitrate;
		mergedMetadata.duration ??= metadata2.duration;
		mergedMetadata.type ??= metadata2.type;
		mergedMetadata.discogsId ??= metadata2.discogsId;
		return mergedMetadata;
	}

	private async sanitizeAndValidateMetadata(
		metadata: Metadata,
	): Promise<Metadata> {
		metadata.album ??= metadata.release!;
		metadata.release ??= metadata.album!;
		metadata.artist ??= metadata.albumArtist!;
		if (
			!metadata.compilation &&
			!metadata.albumArtist &&
			!metadata.artist
		) {
			throw new BadMetadataException(
				"Missing Field Album Artist / Artist",
			);
		}
		const errors = await validate(metadata);

		if (errors.length != 0) {
			throw new BadMetadataException(
				errors
					.map((error) => JSON.stringify(error.constraints ?? {}))
					.join("\n"),
			);
		}
		return metadata;
	}

	/**
	 * Regular Expression to match source cover files
	 */
	public static SOURCE_ILLUSTRATON_FILE = "[Cc]over.*";

	/**
	 * Extracts the embedded illustration of a file
	 * @param filePath the full path to the source file to scrap
	 */
	async extractIllustrationFromFile(
		filePath: string,
	): Promise<Buffer | null> {
		if (!this.fileManagerService.fileExists(filePath)) {
			throw new FileDoesNotExistException(filePath);
		}
		try {
			const rawMetadata: IAudioMetadata = await mm.parseFile(filePath, {
				skipCovers: false,
			});

			return mm.selectCover(rawMetadata.common.picture)?.data ?? null;
		} catch {
			throw new FileParsingException(filePath);
		}
	}

	/**
	 * Get a stream of the illustration file in the same folder as file
	 * @param filePath the full path to the source file to scrap
	 * @example "./a.m4a" will try to parse "./cover.jpg"
	 */
	async extractIllustrationInFileFolder(
		filePath: string,
	): Promise<Buffer | null> {
		const fileFolder = dir.dirname(filePath);
		const illustrationCandidates = glob.sync(
			`${escapeRegex(fileFolder)}/${
				ScannerService.SOURCE_ILLUSTRATON_FILE
			}`,
		);

		if (illustrationCandidates.length == 0) {
			return null;
		}
		return this.fileManagerService.getFileBuffer(illustrationCandidates[0]);
	}
}
