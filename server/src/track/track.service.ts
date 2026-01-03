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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { FileNotFoundException } from "src/file/file.exceptions";
import FileService from "src/file/file.service";
import { filterToPrisma } from "src/filter/filter";
import type Identifier from "src/identifier/models/identifier";
import IllustrationRepository from "src/illustration/illustration.repository";
import LibraryService from "src/library/library.service";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import type ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import type SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import VideoService from "src/video/video.service";
import type TrackQueryParameters from "./models/track.query-parameters";
import {
	MasterTrackNotFoundException,
	TrackAlreadyExistsException,
	TrackNotFoundException,
} from "./track.exceptions";

@Injectable()
export default class TrackService {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => VideoService))
		private videoService: VideoService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => IllustrationRepository))
		private illustrationRepository: IllustrationRepository,
		private prismaService: PrismaService,
	) {}

	async get<I extends TrackQueryParameters.RelationInclude = {}>(
		where: TrackQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: TrackService.formatWhereInput(where),
		};
		return this.prismaService.track
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.TrackFindFirstOrThrowArgs
				>
			>(args)
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
	}

	async getMany<I extends TrackQueryParameters.RelationInclude = {}>(
		where: TrackQueryParameters.ManyWhereInput,
		sort: TrackQueryParameters.SortingParameter = {},
		pagination: PaginationParameters = {},
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: TrackService.formatManyWhereInput(where),
			orderBy: this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		const tracks =
			await this.prismaService.track.findMany<
				Prisma.SelectSubset<typeof args, Prisma.TrackFindManyArgs>
			>(args);
		return tracks;
	}

	async create<I extends TrackQueryParameters.RelationInclude = {}>(
		input: TrackQueryParameters.CreateInput,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			data: {
				...input,
				song: input.song
					? {
							connect: SongService.formatWhereInput(input.song),
						}
					: undefined,
				release: input.release
					? {
							connect: ReleaseService.formatWhereInput(
								input.release,
							),
						}
					: undefined,
				sourceFile: {
					connect: FileService.formatWhereInput(input.sourceFile),
				},
				video: input.video
					? { connect: VideoService.formatWhereInput(input.video) }
					: undefined,
			},
		};
		return this.prismaService.track
			.create<Prisma.SelectSubset<typeof args, Prisma.TrackCreateArgs>>(
				args,
			)
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const parentSong = input.song
						? await this.songService.get(input.song, {
								artist: true,
							})
						: undefined;

					await this.fileService.get(input.sourceFile);
					if (input.release) {
						const parentRelease = await this.releaseService.get(
							input.release,
						);

						if (
							error.code === PrismaError.RequiredRelationViolation
						) {
							throw new TrackAlreadyExistsException(
								input.name,
								new Slug(parentRelease.slug),
								parentSong
									? new Slug(parentSong.artist.slug)
									: undefined,
							);
						}
					}
				}
				throw new UnhandledORMErrorException(error, input);
			});
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

	static formatManyWhereInput(
		where: TrackQueryParameters.ManyWhereInput,
	): Prisma.TrackWhereInput {
		const query: Prisma.TrackWhereInput[] = [];

		if (where.tracks) {
			query.push({
				OR: where.tracks.map((track) =>
					TrackService.formatWhereInput(track),
				),
			});
		}
		if (where.song) {
			query.push({
				song: filterToPrisma(where.song, SongService.formatWhereInput),
			});
		}
		if (where.video) {
			query.push({
				video: filterToPrisma(
					where.video,
					VideoService.formatWhereInput,
				),
			});
		}
		if (where.library) {
			query.push({
				sourceFile: {
					library: filterToPrisma(
						where.library,
						LibraryService.formatWhereInput,
					),
				},
			});
		}

		if (where.release) {
			query.push({
				release: filterToPrisma(
					where.release,
					ReleaseService.formatWhereInput,
				),
			});
		}
		if (where.exclusiveOn) {
			query.push({
				type: "Audio",
				song: {
					group: {
						versions: {
							some: {
								type: "Original",
								tracks: {
									every: {
										release: {
											OR: [
												{
													album: {
														type: {
															not: "StudioRecording",
														},
													},
												},
												ReleaseService.formatWhereInput(
													where.exclusiveOn,
												),
											],
										},
									},
								},
							},
						},
					},
				},
				release: ReleaseService.formatWhereInput(where.exclusiveOn),
			});
		}
		if (where.album) {
			query.push({
				song: {
					tracks: {
						some: {
							release: {
								album: filterToPrisma(
									where.album,
									AlbumService.formatWhereInput,
								),
							},
						},
					},
				},
			});
		}
		if (where.artist !== undefined) {
			query.push({
				release: {
					// NOTE: Not sure why the null cast is necessary
					album: filterToPrisma(where.artist!, (a) =>
						AlbumService.formatManyWhereInput({
							artist: { is: a! },
						}),
					),
				},
			});
		}
		return {
			AND: query,
			type: where.type,
		};
	}

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): TrackQueryParameters.WhereInput {
		return formatIdentifier(identifier, (_) => {
			throw new InvalidRequestException(
				`Identifier: expected a number, got ${identifier}`,
			);
		});
	}

	formatSortingInput(
		sortingParameter: TrackQueryParameters.SortingParameter,
	): Prisma.TrackOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "releaseName":
				return [
					{ release: { name: sortingParameter.order } },
					{ discIndex: { sort: "asc", nulls: "last" } },
					{ trackIndex: { sort: "asc", nulls: "last" } },
					{ id: "asc" },
				];
			case "releaseDate":
				return [
					{
						release: {
							releaseDate: {
								sort: sortingParameter.order,
								nulls: "last",
							},
						},
					},
					{ id: "asc" },
				];
			case "addDate":
				return [
					{ sourceFile: { registerDate: sortingParameter.order } },
					{ id: sortingParameter.order },
				];
			default:
				return [
					{
						[sortingParameter.sortBy ?? "id"]:
							sortingParameter.order,
					},
				];
		}
	}

	/**
	 * Callback on track not found
	 * @param where the query parameters that failed to get the release
	 */
	onNotFound(error: Error, where: TrackQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			if (where.id !== undefined) {
				return new TrackNotFoundException(where.id);
			}
			return new FileNotFoundException(
				where.sourceFile.id ?? where.sourceFile.byPath!.path,
			);
		}
		return new UnhandledORMErrorException(error, where);
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
		return this.songService
			.get(where, { artist: true })
			.then(async (song) => {
				if (song.masterId !== null) {
					return this.get({ id: song.masterId }, include);
				}
				const tracks = await this.prismaService.track.findMany({
					where: { song: SongService.formatWhereInput(where) },
					include: include,
					orderBy: {
						release: {
							releaseDate: { sort: "asc", nulls: "last" },
						},
					},
				});
				const master =
					tracks.find((track) => track.type === "Audio") ??
					tracks.at(0);

				if (!master) {
					throw new MasterTrackNotFoundException(
						new Slug(song.slug),
						new Slug(song.artist.slug),
					);
				}
				return master;
			});
	}

	/**
	 * Fetch the master tracks of a video
	 * @param where the parameters to find the parent video
	 * @param include the relation to include in the returned object
	 * @returns the master track of the video
	 */
	async getVideoMasterTrack(
		where: SongQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
	) {
		return this.videoService
			.get(where, { artist: true })
			.then(async (video) => {
				if (video.masterId !== null) {
					return this.get({ id: video.masterId }, include);
				}
				const tracks = await this.prismaService.track.findMany({
					where: { video: VideoService.formatWhereInput(where) },
					include: include,
					orderBy: {
						bitrate: { sort: "desc", nulls: "last" },
					},
				});
				const master =
					tracks.find((track) => track.type === "Video") ??
					tracks.at(0);

				if (!master) {
					throw new MasterTrackNotFoundException(
						new Slug(video.slug),
						new Slug(video.artist.slug),
					);
				}
				return master;
			});
	}

	/**
	 * Get Playlist of release
	 * @param where query paremeters to find the release
	 * @returns all the tracks, ordered, from a release
	 */
	async getTracklist(
		where: ReleaseQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		exclusiveOnly?: boolean,
		include?: SongQueryParameters.RelationInclude,
	) {
		const tracks = await this.prismaService.track.findMany({
			where: TrackService.formatManyWhereInput(
				exclusiveOnly
					? { exclusiveOn: where }
					: { release: { is: where } },
			),
			orderBy: [
				{ discIndex: { sort: "asc", nulls: "last" } },
				{ trackIndex: { sort: "asc", nulls: "last" } },
			],
			...formatPaginationParameters(pagination),
			include: {
				illustration: true,
				song: { include: include },
				video: { include: { artist: include?.artist ?? false } },
			},
		});

		if (tracks.length === 0) {
			await this.releaseService.get(where);
		}

		return tracks;
	}

	async update(
		what: TrackQueryParameters.UpdateInput,
		where: TrackQueryParameters.WhereInput,
	) {
		if (what.song) {
			await this.songService.get(what.song); // Just to check that the song exists
		}
		const updatedTrack = await this.prismaService.track
			.update({
				where: TrackService.formatWhereInput(where),
				data: {
					...what,
					standaloneIllustrationId: undefined,
					standaloneIllustration: what.standaloneIllustrationId
						? { connect: { id: what.standaloneIllustrationId } }
						: undefined,
					thumbnailId: undefined,
					thumbnail: what.thumbnailId
						? { connect: { id: what.thumbnailId } }
						: undefined,
					video: what.video
						? {
								connect: VideoService.formatWhereInput(
									what.video,
								),
							}
						: undefined,
					song: what.song
						? {
								connect: SongService.formatWhereInput(
									what.song,
								),
							}
						: undefined,
					release: what.release
						? {
								connect: ReleaseService.formatWhereInput(
									what.release,
								),
							}
						: undefined,
					sourceFile: what.sourceFile
						? {
								connect: FileService.formatWhereInput(
									what.sourceFile,
								),
							}
						: undefined,
				},
			})
			.catch((error) => {
				throw this.onNotFound(error, where);
			});
		if (what.song) {
			await this.songService.housekeeping();
		}
		return updatedTrack;
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
	 * Delete tracks
	 * @param where Query parameters to find the tracks to delete
	 */
	async delete(where: TrackQueryParameters.DeleteInput[]): Promise<number> {
		if (!where.length) {
			return 0;
		}
		const chunkSize = 30;
		let totalDeleted = 0;
		for (let idx = 0; idx < where.length; idx += chunkSize) {
			const whereChunk = where
				.slice(idx, idx + chunkSize)
				.map((track) => this.formatDeleteInputToWhereInput(track));

			const toDelete = await this.getMany({
				tracks: whereChunk,
			});
			await Promise.allSettled(
				toDelete
					.filter(({ thumbnailId }) => thumbnailId !== null)
					.map(({ thumbnailId }) =>
						this.illustrationRepository.deleteIllustration(
							thumbnailId!,
						),
					),
			);

			await Promise.allSettled(
				toDelete
					.filter(({ releaseId }) => releaseId !== null)
					.map(({ releaseId, discIndex, trackIndex }) =>
						this.illustrationRepository
							.getReleaseIllustrations({ id: releaseId! })
							.then(async (relatedIllustrations) => {
								const exactIllustration =
									relatedIllustrations.find(
										(i) =>
											i.disc !== null &&
											i.track !== null &&
											i.disc === discIndex &&
											i.track === trackIndex,
									);
								if (exactIllustration) {
									await this.illustrationRepository.deleteIllustration(
										exactIllustration.id,
									);
								}
							}),
					),
			);
			const deleted = await this.prismaService.track.deleteMany({
				where: TrackService.formatManyWhereInput({
					tracks: whereChunk,
				}),
			});
			totalDeleted = totalDeleted + deleted.count;
		}
		return totalDeleted;
	}

	/**
	 * Does nothing, nothing to housekeep.
	 */
	async housekeeping(): Promise<void> {}
}
