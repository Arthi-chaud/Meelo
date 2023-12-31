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
import PrismaService from "src/prisma/prisma.service";
import { Prisma } from "@prisma/client";
import SongService from "src/song/song.service";
import {
	MasterTrackNotFoundException,
	TrackAlreadyExistsException,
	TrackNotFoundByIdException,
} from "./track.exceptions";
import ReleaseService from "src/release/release.service";
import type TrackQueryParameters from "./models/track.query-parameters";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import type SongQueryParameters from "src/song/models/song.query-params";
import FileService from "src/file/file.service";
import Slug from "src/slug/slug";
import Tracklist, { UnknownDiscIndexKey } from "./models/tracklist.model";
import RepositoryService from "src/repository/repository.service";
import { shuffle } from "@taumechanica/stout";
import AlbumService from "src/album/album.service";
import LibraryService from "src/library/library.service";
import { Track, TrackWithRelations } from "src/prisma/models";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import {
	FileNotFoundFromIDException,
	FileNotFoundFromPathException,
} from "src/file/file.exceptions";
import IllustrationRepository from "src/illustration/illustration.repository";
import deepmerge from "deepmerge";
import SongVersionService from "src/song-version/song-version.service";
import SongVersionQueryParameters from "src/song-version/models/song-version.query-params";

@Injectable()
export default class TrackService extends RepositoryService<
	TrackWithRelations,
	TrackQueryParameters.CreateInput,
	TrackQueryParameters.WhereInput,
	TrackQueryParameters.ManyWhereInput,
	TrackQueryParameters.UpdateInput,
	TrackQueryParameters.DeleteInput,
	TrackQueryParameters.SortingKeys,
	Prisma.TrackCreateInput,
	Prisma.TrackWhereInput,
	Prisma.TrackWhereInput,
	Prisma.TrackUpdateInput,
	Prisma.TrackWhereUniqueInput,
	Prisma.TrackOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(TrackService.name);
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => SongVersionService))
		private songVersionService: SongVersionService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		private prismaService: PrismaService,
	) {
		super(prismaService, "track");
	}

	getTableName() {
		return "tracks";
	}

	/**
	 * Create
	 */
	formatCreateInput(input: TrackQueryParameters.CreateInput) {
		return {
			...input,
			songVersion: {
				connect: SongVersionService.formatWhereInput(input.songVersion),
			},
			release: {
				connect: ReleaseService.formatWhereInput(input.release),
			},
			sourceFile: {
				connect: FileService.formatWhereInput(input.sourceFile),
			},
		};
	}

	protected async onCreationFailure(
		error: Error,
		input: TrackQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const parentSong = await this.songService.get(
				{
					version: input.songVersion,
				},
				{
					artist: true,
				},
			);
			const parentRelease = await this.releaseService.get(input.release);

			await this.fileService.throwIfNotFound(input.sourceFile);
			if (error.code === PrismaError.RequiredRelationViolation) {
				return new TrackAlreadyExistsException(
					input.name,
					new Slug(parentRelease.slug),
					new Slug(parentSong.artist.slug),
				);
			}
		}
		return this.onUnknownError(error, input);
	}

	protected formatCreateInputToWhereInput(
		input: TrackQueryParameters.CreateInput,
	): TrackQueryParameters.WhereInput {
		return input;
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: TrackQueryParameters.WhereInput) {
		return {
			id: where.id,
			sourceFile: where.sourceFile
				? FileService.formatWhereInput(where.sourceFile)
				: undefined,
		};
	}

	formatWhereInput = TrackService.formatWhereInput;

	static formatManyWhereInput(
		where: TrackQueryParameters.ManyWhereInput,
	): Prisma.TrackWhereInput {
		let queryParameters: Prisma.TrackWhereInput = {
			type: where.type,
		};

		if (where.id) {
			queryParameters = deepmerge(queryParameters, { id: where.id });
		}
		if (where.song) {
			queryParameters = deepmerge(queryParameters, {
				songVersion: { song: SongService.formatWhereInput(where.song) },
			});
		}
		if (where.songVersion) {
			queryParameters = deepmerge(queryParameters, {
				songVersion: SongVersionService.formatWhereInput(
					where.songVersion,
				),
			});
		}

		if (where.library) {
			queryParameters = deepmerge(queryParameters, {
				sourceFile: {
					library: LibraryService.formatWhereInput(where.library),
				},
			});
		}

		if (where.release) {
			queryParameters = deepmerge(queryParameters, {
				release: ReleaseService.formatWhereInput(where.release),
			});
		}
		if (where.album) {
			queryParameters = deepmerge(queryParameters, {
				songVersion: {
					tracks: {
						some: {
							release: {
								album: AlbumService.formatWhereInput(
									where.album,
								),
							},
						},
					},
				},
			});
		}
		if (where.artist) {
			queryParameters = deepmerge(queryParameters, {
				release: {
					album: AlbumService.formatManyWhereInput({
						artist: where.artist,
					}),
				},
			});
		}
		return queryParameters;
	}

	formatManyWhereInput = TrackService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): TrackQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			RepositoryService.UnexpectedStringIdentifier,
		);
	}

	formatSortingInput(
		sortingParameter: TrackQueryParameters.SortingParameter,
	): Prisma.TrackOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
			case "releaseName":
				return { release: { name: sortingParameter.order } };
			case "releaseDate":
				return {
					release: {
						releaseDate: {
							sort: sortingParameter.order,
							nulls: "last",
						},
					},
				};
			case "addDate":
				return { sourceFile: { registerDate: sortingParameter.order } };
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	/**
	 * Callback on track not found
	 * @param where the query parameters that failed to get the release
	 */
	onNotFound(error: Error, where: TrackQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				return new TrackNotFoundByIdException(where.id);
			}
			if (where.sourceFile.id !== undefined) {
				return new FileNotFoundFromIDException(where.sourceFile.id);
			}
			return new FileNotFoundFromPathException(
				where.sourceFile.byPath!.path,
			);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Fetch the master tracks of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the master track of the song
	 */
	async getSongMasterTrack(
		where: SongQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
	) {
		const mainVersion = await this.songVersionService.getMainVersion(where);
		return this.getSongVersionMasterTrack(mainVersion, include);
	}

	/**
	 * Fetch the master tracks of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the master track of the song
	 */
	async getSongVersionMasterTrack(
		where: SongVersionQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
	) {
		const tracks = await this.prismaService.track.findMany({
			where: {
				songVersion: SongVersionService.formatWhereInput(where),
			},
			include: this.formatInclude(include),
			orderBy: {
				release: {
					releaseDate: { sort: "asc", nulls: "last" },
				},
			},
		});
		const master =
			tracks.find((track) => track.type == "Audio") ?? tracks.at(0);

		if (!master) {
			const parentSong = await this.songService.get(
				{
					version: where,
				},
				{
					artist: true,
				},
			);
			throw new MasterTrackNotFoundException(
				new Slug(parentSong.slug),
				new Slug(parentSong.artist.slug),
			);
		}
		return master;
	}

	/**
	 * Get Tracklist of release
	 * @param where
	 * @returns the tracklist of the release
	 */
	async getTracklist(
		where: ReleaseQueryParameters.WhereInput,
		include?: SongQueryParameters.RelationInclude,
	): Promise<Tracklist> {
		let tracklist: Tracklist = new Map();
		const tracks = await this.prismaService.track.findMany({
			where: this.formatManyWhereInput({ release: where }),
			orderBy: { trackIndex: "asc" },
			include: {
				songVersion: {
					include: {
						song: { include: SongService.formatInclude(include) },
					},
				},
			},
		});

		if (tracks.length == 0) {
			await this.releaseService.throwIfNotFound(where);
		}
		tracks.forEach((track) => {
			const indexToString =
				track.discIndex?.toString() ?? UnknownDiscIndexKey;

			tracklist = tracklist.set(indexToString, [
				...(tracklist.get(indexToString) ?? []),
				track,
			]);
		});
		return new Map([...tracklist].sort());
	}

	/**
	 * Get Playlist of release
	 * @param where query paremeters to find the release
	 * @returns all the tracks, ordered, from a release
	 */
	async getPlaylist(
		where: ReleaseQueryParameters.WhereInput,
		include?: SongQueryParameters.RelationInclude,
		random = false,
	): Promise<Track[]> {
		const tracklist = await this.getTracklist(where, include);
		let playlist: Track[] = [];

		tracklist.forEach((disc) => (playlist = playlist.concat(disc)));
		if (random) {
			shuffle(playlist);
		}
		return playlist;
	}

	/**
	 * Update
	 */
	formatUpdateInput(
		what: Partial<TrackQueryParameters.CreateInput>,
	): Prisma.TrackUpdateInput {
		return {
			...what,
			songVersion: what.songVersion
				? {
					connect: SongVersionService.formatWhereInput(
						what.songVersion,
					),
				}
				: undefined,
			release: what.release
				? {
					connect: ReleaseService.formatWhereInput(what.release),
				}
				: undefined,
			sourceFile: what.sourceFile
				? {
					connect: FileService.formatWhereInput(what.sourceFile),
				}
				: undefined,
		};
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: TrackQueryParameters.DeleteInput) {
		return where;
	}

	protected formatDeleteInputToWhereInput(
		input: TrackQueryParameters.DeleteInput,
	) {
		if (input.id) {
			return { id: input.id };
		}
		return { sourceFile: { id: input.sourceFileId! } };
	}

	/**
	 * Deletes a track
	 * @param where Query parameters to find the track to delete
	 */
	async delete(where: TrackQueryParameters.DeleteInput): Promise<Track> {
		await this.illustrationRepository.deleteTrackIllustration(
			this.formatDeleteInputToWhereInput(where),
		);

		return super.delete(where).then((deleted) => {
			this.logger.warn(`Track '${deleted.name}' deleted`);
			return deleted;
		});
	}

	/**
	 * Does nothing, nothing to housekeep.
	 */
	async housekeeping(): Promise<void> { }

	/**
	 * Change the track's parent song version
	 * If the previous parent is empty, it will be deleted
	 * @param trackWhere the query parameters to find the track to reassign
	 * @param newParentWhere the query parameters to find the song version to reassign the track to
	 */
	async reassign(
		trackWhere: TrackQueryParameters.WhereInput,
		newParentWhere: SongVersionQueryParameters.WhereInput,
	): Promise<Track> {
		const track = await this.get(trackWhere, { songVersion: true });
		const newParent = await this.songVersionService.get(newParentWhere);

		if (track.id == track.songVersion.masterId) {
			await this.albumService.unsetMasterRelease({
				id: track.songVersionId,
			});
		}
		return this.update({ songVersion: { id: newParent.id } }, trackWhere);
	}
}
