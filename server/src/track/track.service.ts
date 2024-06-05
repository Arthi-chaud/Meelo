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
import AlbumService from "src/album/album.service";
import LibraryService from "src/library/library.service";
import { Track } from "src/prisma/models";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import {
	FileNotFoundFromIDException,
	FileNotFoundFromPathException,
} from "src/file/file.exceptions";
import IllustrationRepository from "src/illustration/illustration.repository";
import deepmerge from "deepmerge";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import {
	formatIdentifier,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";

@Injectable()
export default class TrackService {
	private readonly logger = new Logger(TrackService.name);
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
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
		const tracks = await this.prismaService.track.findMany<
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
				song: {
					connect: SongService.formatWhereInput(input.song),
				},
				release: {
					connect: ReleaseService.formatWhereInput(input.release),
				},
				sourceFile: {
					connect: FileService.formatWhereInput(input.sourceFile),
				},
			},
		};
		return this.prismaService.track
			.create<Prisma.SelectSubset<typeof args, Prisma.TrackCreateArgs>>(
				args,
			)
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const parentSong = await this.songService.get(input.song, {
						artist: true,
					});
					const parentRelease = await this.releaseService.get(
						input.release,
					);

					await this.fileService.get(input.sourceFile);
					if (error.code === PrismaError.RequiredRelationViolation) {
						throw new TrackAlreadyExistsException(
							input.name,
							new Slug(parentRelease.slug),
							new Slug(parentSong.artist.slug),
						);
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
		let queryParameters: Prisma.TrackWhereInput = {
			type: where.type,
		};

		if (where.id) {
			queryParameters = deepmerge(queryParameters, { id: where.id });
		}
		if (where.song) {
			queryParameters = deepmerge(queryParameters, {
				song: SongService.formatWhereInput(where.song),
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
				song: {
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
	): Prisma.TrackOrderByWithRelationAndSearchRelevanceInput {
		sortingParameter.order ??= "asc";
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
		return new UnhandledORMErrorException(error, where);
	}

	/**
	 * Fetch the master tracks of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the master track of the song
	 */
	async getMasterTrack(
		where: SongQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
	) {
		return this.songService
			.get(where, { artist: true })
			.then(async (song) => {
				if (song.masterId != null) {
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
					tracks.find((track) => track.type == "Audio") ??
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
			where: TrackService.formatManyWhereInput({ release: where }),
			orderBy: { trackIndex: "asc" },
			include: { song: { include: include } },
		});

		if (tracks.length == 0) {
			await this.releaseService.get(where);
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
			return playlist
				.map((value) => ({ value, sort: Math.random() }))
				.sort((a, b) => a.sort - b.sort)
				.map(({ value }) => value);
		}
		return playlist;
	}

	async update(
		what: TrackQueryParameters.UpdateInput,
		where: TrackQueryParameters.WhereInput,
	) {
		return this.prismaService.track
			.update({
				where: TrackService.formatWhereInput(where),
				data: {
					...what,
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
		return this.prismaService.track
			.delete({
				where: where,
			})
			.then((deleted) => {
				this.illustrationRepository
					.getReleaseIllustrations({ id: deleted.releaseId })
					.then((relatedIllustrations) => {
						const exactIllustration = relatedIllustrations.find(
							(i) =>
								i.disc !== null &&
								i.track !== null &&
								i.disc === deleted.discIndex &&
								i.track === deleted.trackIndex,
						);
						if (exactIllustration) {
							this.illustrationRepository.deleteIllustration(
								exactIllustration.id,
							);
						}
					});
				this.logger.warn(`Track '${deleted.name}' deleted`);
				return deleted;
			})
			.catch((error) => {
				throw this.onNotFound(
					error,
					this.formatDeleteInputToWhereInput(where),
				);
			});
	}

	/**
	 * Does nothing, nothing to housekeep.
	 */
	async housekeeping(): Promise<void> {}
}
