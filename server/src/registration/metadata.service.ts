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
import Metadata from "./models/metadata";
import TrackService from "src/track/track.service";
import SongService from "src/song/song.service";
import { AlbumType, TrackType } from "@prisma/client";
import ReleaseService from "src/release/release.service";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import type TrackQueryParameters from "src/track/models/track.query-parameters";
import GenreService from "src/genre/genre.service";
import { File } from "src/prisma/models";
import ParserService from "../parser/parser.service";
import Slug from "src/slug/slug";
import VideoService from "src/video/video.service";

@Injectable()
export default class MetadataService {
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
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
		@Inject(forwardRef(() => VideoService))
		private videoService: VideoService,
	) {}

	/**
	 * Pushed the metadata to the database, calling vairous repositories
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
		const videoName =
			this.parserService.removeVideoExtensions(parsedSongName);
		const videoType = this.parserService.getVideoType(videoName);

		const parsedTrackName =
			this.parserService.parseTrackExtensions(parsedSongName);
		const songGroupSlug = new Slug(
			songArtist.name,
			this.parserService.stripGroups(parsedTrackName.parsedName) ||
				parsedTrackName.parsedName,
			// If there is no root (e.g. `(Exchange)`), `stripGroups` will return an empty string.
			// If it does, let's just pass the entire song name
		);

		const song = !VideoService.videoTypeIsExtra(videoType)
			? await this.songService.getOrCreate(
					{
						name: parsedTrackName.parsedName,
						group: {
							slug: songGroupSlug,
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
						master: true,
					},
			  )
			: null;

		if (song) {
			await this.songService.update(
				{
					genres: song.genres
						.concat(genres)
						.map((genre) => ({ id: genre.id })),
				},
				{ id: song.id },
			);
		}

		const video =
			metadata.type == TrackType.Video
				? await this.videoService.create({
						name: videoName,
						type: videoType,
						artist: { id: songArtist.id },
						group: {
							slug: songGroupSlug,
						},
						song: song ? { id: song.id } : undefined,
				  })
				: null;

		const album = metadata.album
			? await this.albumService.getOrCreate(
					{
						name: this.parserService.parseReleaseExtension(
							metadata.album,
						).parsedName,
						artist: albumArtist
							? { id: albumArtist?.id }
							: undefined,
						registeredAt: file.registerDate,
					},
					{ releases: true },
			  )
			: undefined;
		//TODO Link to album
		const parsedReleaseName = metadata.release
			? this.parserService.parseReleaseExtension(metadata.release)
			: undefined;
		const release =
			parsedReleaseName && album
				? await this.releaseService.getOrCreate(
						{
							name: parsedReleaseName.parsedName,
							extensions: parsedReleaseName.extensions,
							releaseDate: metadata.releaseDate,
							album: { id: album.id },
							registeredAt: file.registerDate,
							discogsId: metadata.discogsId,
						},
						{ album: true },
				  )
				: undefined;
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
			release: release ? { id: release.id } : undefined,
			song: song && !video ? { id: song.id } : undefined,
			video: video ? { id: video.id } : undefined,
		};
		if (release && album) {
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
				(metadata.releaseDate &&
					release.releaseDate < metadata.releaseDate)
			) {
				await this.releaseService.update(
					{ releaseDate: metadata.releaseDate },
					{ id: release.id },
				);
			}
		}
		if (overwrite) {
			await this.trackService.delete({ sourceFileId: file.id });
		}
		return this.trackService.create(track).then((res) => {
			if (
				song &&
				(song.masterId === null ||
					song.master?.type == TrackType.Video) &&
				track.type === TrackType.Audio
			) {
				this.songService.setMasterTrack({ id: res.id });
			}
			return res;
		});
	}
}
