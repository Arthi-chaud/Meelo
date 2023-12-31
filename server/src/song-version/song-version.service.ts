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
import { Prisma, SongVersion } from "@prisma/client";
import { SongVersionWithRelations } from "src/prisma/models";
import SongVersionQueryParameters from "./models/song-version.query-params";
import RepositoryService from "src/repository/repository.service";
import ArtistService from "src/artist/artist.service";
import Slug from "src/slug/slug";
import PrismaService from "src/prisma/prisma.service";
import SongService from "src/song/song.service";
import { PrismaError } from "prisma-error-enum";
import {
	MainSongVersionNotFoundException,
	SongVersionAlreadyExistsException,
	SongVersionNotFoundByIdException,
	SongVersionNotFoundBySlugException,
} from "./song-version.exceptions";
import deepmerge from "deepmerge";
import SongQueryParameters from "src/song/models/song.query-params";
import TrackService from "src/track/track.service";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import LibraryService from "src/library/library.service";

@Injectable()
export default class SongVersionService extends RepositoryService<
	SongVersionWithRelations,
	SongVersionQueryParameters.CreateInput,
	SongVersionQueryParameters.WhereInput,
	SongVersionQueryParameters.ManyWhereInput,
	SongVersionQueryParameters.UpdateInput,
	SongVersionQueryParameters.DeleteInput,
	SongVersionQueryParameters.SortingKeys,
	Prisma.SongVersionCreateInput,
	Prisma.SongVersionWhereUniqueInput,
	Prisma.SongVersionWhereInput,
	Prisma.SongVersionUpdateInput,
	Prisma.SongVersionWhereUniqueInput,
	Prisma.SongVersionOrderByWithRelationAndSearchRelevanceInput
> {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
	) {
		super(prismaService, "songVersion");
	}

	getTableName() {
		return "song_versions";
	}

	formatCreateInput(
		version: SongVersionQueryParameters.CreateInput,
	): Prisma.SongVersionCreateInput {
		return {
			song: {
				connect: SongService.formatWhereInput(version.song),
			},
			featuring: version.featuring
				? {
						connect: version.featuring.map(
							ArtistService.formatWhereInput,
						),
				  }
				: undefined,
			type: version.type,
			name: version.name,
			slug: this._createSongVersionSlug(
				version.name,
				version.featuring,
			).toString(),
		};
	}

	private _createSongVersionSlug(
		songName: string,
		featuring: SongVersionQueryParameters.CreateInput["featuring"],
	) {
		if (featuring && featuring.length > 0) {
			return new Slug(
				songName,
				"feat",
				...featuring.map((feat) => feat.slug.toString()),
			);
		}
		return new Slug(songName);
	}

	protected async onCreationFailure(
		error: Error,
		input: SongVersionQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const song = await this.songService.get(input.song, {
				artist: true,
			});
			if (error.code === PrismaError.UniqueConstraintViolation) {
				return new SongVersionAlreadyExistsException(
					new Slug(input.name),
					new Slug(song.slug),
					new Slug(song.artist.slug),
				);
			}
		}
		return this.onUnknownError(error, input);
	}
	protected formatCreateInputToWhereInput(
		input: SongVersionQueryParameters.CreateInput,
	): SongVersionQueryParameters.WhereInput {
		return {
			bySlug: {
				slug: this._createSongVersionSlug(input.name, input.featuring),
				song: input.song,
			},
		};
	}
	static formatWhereInput(
		input: SongVersionQueryParameters.WhereInput,
	): Prisma.SongVersionWhereUniqueInput {
		return {
			id: input.id,
			slug: input.bySlug?.slug.toString(),
			songId: input.bySlug?.song.id,
			// featuring: input.bySlug?.featuring
			// 	? {
			// 			every: {
			// 				OR: input.bySlug.featuring.map(
			// 					ArtistService.formatWhereInput,
			// 				),
			// 			},
			// 	  }
			// 	: undefined,
		};
	}

	formatWhereInput = SongVersionService.formatWhereInput;

	async onNotFound(
		error: Error,
		where: SongVersionQueryParameters.WhereInput,
	) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				return new SongVersionNotFoundByIdException(where.id);
			}
			await this.songService.throwIfNotFound(where.bySlug.song);
			return new SongVersionNotFoundBySlugException(where.bySlug.slug);
		}
		return this.onUnknownError(error, where);
	}

	formatManyWhereInput(
		input: SongVersionQueryParameters.ManyWhereInput,
	): Prisma.SongVersionWhereInput {
		let query: Prisma.SongVersionWhereInput = {
			type: input.type,
		};
		if (input.id) {
			query = deepmerge(query, { id: input.id });
		}
		if (input.song) {
			query = deepmerge(query, {
				song: SongService.formatWhereInput(input.song),
			});
		}
		if (input.library) {
			query = deepmerge(query, {
				tracks: {
					some: {
						sourceFile: {
							library: LibraryService.formatWhereInput(input.library)
						}
					}
				},
			});
		}
		if (input.artist) {
			query = deepmerge(query, {
				song: {
					artist: ArtistService.formatWhereInput(input.artist),
				}
			});
		}
		return query;
	}
	formatSortingInput(
		sortingParameter: SongVersionQueryParameters.SortingParameter,
	): Prisma.SongVersionOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}
	formatUpdateInput(
		what: SongVersionQueryParameters.UpdateInput,
	): Prisma.SongVersionUpdateInput {
		return {
			...what,
			featuring: what.featuring
				? {
						connect: what.featuring.map(
							ArtistService.formatWhereInput,
						),
				  }
				: undefined,
			song: what.song
				? {
						connect: SongService.formatWhereInput(what.song),
				  }
				: undefined,
		};
	}
	formatDeleteInput(
		where: SongVersionQueryParameters.DeleteInput,
	): Prisma.SongVersionWhereUniqueInput {
		return where;
	}
	protected formatDeleteInputToWhereInput(
		input: SongVersionQueryParameters.DeleteInput,
	): SongVersionQueryParameters.WhereInput {
		return input;
	}
	/**
	 * Call 'delete' on all songs that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptySongs = await this.prismaService.songVersion
			.findMany({
				select: {
					id: true,
					_count: {
						select: { tracks: true },
					},
				},
			})
			.then((genres) => genres.filter((genre) => !genre._count.tracks));

		await Promise.all(emptySongs.map(({ id }) => this.delete({ id })));
	}

	/**
	 * Fetch the main version of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the main track of the song
	 */
	async getMainVersion(
		where: SongQueryParameters.WhereInput,
		include?: SongVersionQueryParameters.RelationInclude,
	): Promise<SongVersion> {
		const song = await this.songService.get(where, { artist: true });

		if (song.mainVersionId !== null) {
			return this.get({ id: song.mainVersionId }, include);
		}
		const versions = await this.getMany(
			{ song: where },
			undefined,
			include,
			{
				sortBy: "slug",
				order: "asc",
			},
		);
		const first = versions.at(0);

		if (!first) {
			throw new MainSongVersionNotFoundException(
				new Slug(song.slug),
				new Slug(song.artist.slug),
			);
		}
		return first;
	}

	/**
	 * Set the track as master
	 * @param trackWhere the query parameters of the track
	 * @returns the updated song version
	 */
	async setMasterTrack(trackWhere: TrackQueryParameters.WhereInput) {
		const track = await this.trackService.select(trackWhere, {
			id: true,
			songVersionId: true,
		});

		return this.prismaService.songVersion.update({
			where: { id: track.songVersionId },
			data: { masterId: track.id },
		});
	}

	/**
	 * Unset song's master track
	 * @param song the query parameters of the song
	 * @returns the updated song
	 */
	async unsetMasterTrack(songVersionWhere: SongVersionQueryParameters.WhereInput) {
		return this.prismaService.songVersion.update({
			where: SongVersionService.formatWhereInput(songVersionWhere),
			data: { masterId: null },
		});
	}
}
