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
import ArtistService from "src/artist/artist.service";
import Slug from "src/slug/slug";
import { AlbumType, Prisma, SongType, TrackType } from "@prisma/client";
import PrismaService from "src/prisma/prisma.service";
import SongQueryParameters from "./models/song.query-params";
import TrackService from "src/track/track.service";
import GenreService from "src/genre/genre.service";
import RepositoryService from "src/repository/repository.service";
import { CompilationArtistException } from "src/artist/artist.exceptions";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import {
	PaginationParameters,
	buildPaginationParameters,
} from "src/pagination/models/pagination-parameters";
import { Song, SongWithRelations } from "src/prisma/models";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import { PrismaError } from "prisma-error-enum";
import {
	SongAlreadyExistsException,
	SongNotEmptyException,
	SongNotFoundByIdException,
	SongNotFoundException,
} from "./song.exceptions";
import AlbumService from "src/album/album.service";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import ParserService from "src/scanner/parser.service";
import deepmerge from "deepmerge";
import SongGroupService from "./song-group.service";

@Injectable()
export default class SongService extends RepositoryService<
	SongWithRelations,
	SongQueryParameters.CreateInput,
	SongQueryParameters.WhereInput,
	SongQueryParameters.ManyWhereInput,
	SongQueryParameters.UpdateInput,
	SongQueryParameters.DeleteInput,
	SongQueryParameters.SortingKeys,
	Prisma.SongCreateInput,
	Prisma.SongWhereInput,
	Prisma.SongWhereInput,
	Prisma.SongUpdateInput,
	Prisma.SongWhereUniqueInput,
	Prisma.SongOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(SongService.name);
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongGroupService))
		private songGroupService: SongGroupService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		@Inject(forwardRef(() => ParserService))
		private parserService: ParserService,
	) {
		super(prismaService, "song");
	}

	getTableName() {
		return "songs";
	}

	/**
	 * Create
	 */
	async create<I extends SongQueryParameters.RelationInclude>(
		input: SongQueryParameters.CreateInput,
		include?: I,
	) {
		await Promise.all(
			input.genres.map((genre) =>
				this.genreService.throwIfNotFound(genre),
			),
		);
		return super.create(input, include);
	}

	formatCreateInput(
		song: SongQueryParameters.CreateInput,
	): Prisma.SongCreateInput {
		return {
			genres: {
				connect: song.genres.map((genre) =>
					GenreService.formatWhereInput(genre),
				),
			},
			group: {
				connectOrCreate: {
					create: this.songGroupService.formatCreateInput(song.group),
					where: this.songGroupService.formatWhereInput(song.group),
				},
			},
			artist: {
				connect: ArtistService.formatWhereInput(song.artist),
			},
			featuring: song.featuring
				? {
						connect: song.featuring.map(
							ArtistService.formatWhereInput,
						),
				  }
				: undefined,
			registeredAt: song.registeredAt,
			playCount: 0,
			type: this.parserService.getSongType(song.name),
			name: song.name,
			slug: this._createSongSlug(song.name, song.featuring).toString(),
		};
	}

	protected formatCreateInputToWhereInput(
		input: SongQueryParameters.CreateInput,
	): SongQueryParameters.WhereInput {
		return {
			bySlug: {
				slug: this._createSongSlug(input.name, input.featuring),
				artist: input.artist,
			},
		};
	}

	private _createSongSlug(
		songName: string,
		featuring: SongQueryParameters.CreateInput["featuring"],
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
		input: SongQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const artist = await this.artistService.get(input.artist);

			if (error.code === PrismaError.UniqueConstraintViolation) {
				return new SongAlreadyExistsException(
					new Slug(input.name),
					new Slug(artist.name),
				);
			}
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: SongQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug
				? ArtistService.formatWhereInput(where.bySlug.artist)
				: undefined,
			featuring: where.bySlug?.featuring
				? {
						every: {
							OR: where.bySlug.featuring.map(
								ArtistService.formatWhereInput,
							),
						},
				  }
				: undefined,
		};
	}

	formatWhereInput = SongService.formatWhereInput;
	static formatManyWhereInput(where: SongQueryParameters.ManyWhereInput) {
		if (where.artist?.compilationArtist) {
			throw new CompilationArtistException("Song");
		}
		let query: Prisma.SongWhereInput = {
			artistId: where.artist?.id,
			name: buildStringSearchParameters(where.name),
			playCount: {
				equals: where.playCount?.exact,
				gt: where.playCount?.moreThan,
				lt: where.playCount?.below,
			},
			type: where.type,
		};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
		}
		if (where.genre) {
			query = deepmerge(query, {
				genres: {
					some: GenreService.formatWhereInput(where.genre),
				},
			});
		}
		if (where.artist?.slug) {
			query = deepmerge(query, {
				OR: [
					{
						artist: {
							slug: where.artist.slug.toString(),
						},
					},
					{
						featuring: {
							some: { slug: where.artist.slug.toString() },
						},
					},
				],
			});
		}
		if (where.library) {
			query = deepmerge(query, {
				tracks: {
					some: TrackService.formatManyWhereInput({
						library: where.library,
					}),
				},
			});
		}
		if (where.album) {
			query = deepmerge(query, {
				tracks: {
					some: TrackService.formatManyWhereInput({
						album: where.album,
					}),
				},
			});
		}
		if (where.group) {
			query = deepmerge(query, {
				group: SongGroupService.formatWhereInput(where.group),
			} satisfies Prisma.SongWhereInput);
		}
		if (where.versionsOf) {
			query = deepmerge(query, {
				group: {
					versions: {
						some: SongService.formatWhereInput(where.versionsOf),
					},
				},
			} satisfies Prisma.SongWhereInput);
		}
		return query;
	}

	formatManyWhereInput = SongService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): SongQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const slugs = parseIdentifierSlugs(stringIdentifier, 2);

				return {
					bySlug: {
						slug: slugs[1],
						artist: { slug: slugs[0] },
					},
				};
			},
		);
	}

	formatSortingInput(
		sortingParameter: SongQueryParameters.SortingParameter,
	): Prisma.SongOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "addDate":
				return { registeredAt: sortingParameter.order };
			case "artistName":
				return {
					artist: this.artistService.formatSortingInput({
						sortBy: "name",
						order: sortingParameter.order,
					}),
				};
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	async onNotFound(error: Error, where: SongQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				throw new SongNotFoundByIdException(where.id);
			}
			const artist = await this.artistService.get(where.bySlug.artist);

			throw new SongNotFoundException(
				where.bySlug.slug,
				new Slug(artist.slug),
			);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Update
	 */
	formatUpdateInput(
		what: SongQueryParameters.UpdateInput,
	): Prisma.SongUpdateInput {
		return {
			...what,
			slug: what.name ? new Slug(what.name).toString() : undefined,
			genres: what.genres
				? {
						connect: what.genres.map((genre) =>
							GenreService.formatWhereInput(genre),
						),
				  }
				: undefined,
			artist: what.artist
				? {
						connect: ArtistService.formatWhereInput(what.artist),
				  }
				: undefined,
			group: what.group
				? {
						connectOrCreate: {
							create: this.songGroupService.formatCreateInput(
								what.group,
							),
							where: this.songGroupService.formatWhereInput(
								what.group,
							),
						},
				  }
				: undefined,
			featuring: what.featuring
				? {
						connect: what.featuring.map(
							ArtistService.formatWhereInput,
						),
				  }
				: undefined,
		};
	}

	/**
	 * Updates a song in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the album to update
	 * @returns the updated song
	 */
	async update(
		what: SongQueryParameters.UpdateInput,
		where: SongQueryParameters.WhereInput,
	) {
		if (what.genres) {
			await Promise.all(
				what.genres.map((genreWhere) =>
					this.genreService.get(genreWhere),
				),
			);
		}
		if (where.bySlug) {
			const artistId = (
				await this.artistService.select(where.bySlug.artist, {
					id: true,
				})
			).id;

			try {
				return await this.prismaService.song.update({
					data: this.formatUpdateInput(what),
					where: {
						slug_artistId: {
							slug: where.bySlug!.slug.toString(),
							artistId: artistId,
						},
					},
				});
			} catch (error) {
				throw await this.onUpdateFailure(error, what, where);
			}
		} else {
			return super.update(what, where);
		}
	}

	/**
	 * Set the track as song's master
	 * @param trackWhere the query parameters of the track
	 * @returns the updated song
	 */
	async setMasterTrack(trackWhere: TrackQueryParameters.WhereInput) {
		const track = await this.trackService.select(trackWhere, {
			id: true,
			songId: true,
		});

		return this.prismaService.song.update({
			where: { id: track.songId },
			data: { masterId: track.id },
		});
	}

	/**
	 * Unset song's master track
	 * @param song the query parameters of the song
	 * @returns the updated song
	 */
	async unsetMasterTrack(songWhere: SongQueryParameters.WhereInput) {
		return this.prismaService.song.update({
			where: SongService.formatWhereInput(songWhere),
			data: { masterId: null },
		});
	}

	/**
	 * Increment a song's play count
	 * @param where the query parameter to find the song to update
	 * @returns the updated song
	 */
	async incrementPlayCount(
		where: SongQueryParameters.WhereInput,
	): Promise<void> {
		const song = await this.get(where);

		await this.update({ playCount: song.playCount + 1 }, { id: song.id });
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: SongQueryParameters.DeleteInput) {
		return where;
	}

	protected formatDeleteInputToWhereInput(
		input: SongQueryParameters.DeleteInput,
	): SongQueryParameters.WhereInput {
		return { id: input.id };
	}

	/**
	 * Deletes a song
	 * @param where Query parameters to find the song to delete
	 */
	async delete(where: SongQueryParameters.DeleteInput): Promise<Song> {
		return super.delete(where).then((deleted) => {
			this.logger.warn(`Song '${deleted.slug}' deleted`);
			return deleted;
		});
	}

	onDeletionFailure(error: Error, input: SongQueryParameters.DeleteInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.ForeignConstraintViolation
		) {
			return new SongNotEmptyException(input.id);
		}
		return super.onDeletionFailure(error, input);
	}

	/**
	 * Call 'delete' on all songs that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptySongs = await this.prismaService.song
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
	 * Get B-Sides songs of a release
	 * @requires The release must be a StudioRecording Otherwise, returns an empty list
	 */
	async getReleaseBSides<I extends SongQueryParameters.RelationInclude>(
		where: ReleaseQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter,
	) {
		const { album, ...release } = await this.releaseService.get(where, {
			album: true,
		});

		if (album.type != AlbumType.StudioRecording) {
			return [];
		}
		const albumSongs = await this.getMany(
			{ album: { id: album.id } },
			undefined,
			{ tracks: true },
		);
		const albumSongsBaseNames = albumSongs
			// Some albums have live songs from previous albums, we ignore them
			.filter((song) => song.type != SongType.Live)
			// We remove songs that are present only on video in the release
			.filter(
				(song) =>
					song.tracks.find(
						(track) =>
							track.type == "Audio" &&
							track.releaseId == release.id,
					) != undefined,
			)
			.map(({ name }) => new Slug(this.getBaseSongName(name)).toString());

		const relatedAlbums = await this.prismaService.album.findMany({
			where: {
				...AlbumService.formatManyWhereInput({
					related: { id: release.albumId },
				}),
				type: AlbumType.Single,
			},
		});

		return this.prismaService.song.findMany({
			where: {
				tracks: {
					some: {
						release: {
							album: {
								OR: [
									// Get songs from related albums
									{
										id: {
											in: relatedAlbums
												.map(({ id }) => id)
												.concat(album.id),
										},
									},
									// Get songs from singles, based on their name
									...albumSongsBaseNames.map((slug) => ({
										slug: { startsWith: slug },
										artistId: album.artistId,
										type: AlbumType.Single,
									})),
								],
							},
						},
					},
				},
				AND: [
					// Exclude songs that are already on the release
					{
						tracks: {
							none: {
								release: { id: release.id },
							},
						},
					},
					// We only want songs that have at least one audtio tracks
					{ tracks: { some: { type: TrackType.Audio } } },
					{
						type: {
							in: [
								SongType.Original,
								SongType.Acoustic,
								SongType.Demo,
								SongType.NonMusic,
							],
						},
					},
				],
			},
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			include: this.formatInclude(include),
			...buildPaginationParameters(pagination),
		});
	}

	/**
	 * Search for songs using a token.
	 * To match, the song's slug, or its artist's, or one of its track's releases must match the token
	 */
	public async search<I extends SongQueryParameters.RelationInclude>(
		token: string,
		where: SongQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: SongQueryParameters.SortingParameter,
	) {
		if (token.length == 0) {
			return [];
		}
		// Transforms the toke into a slug, and remove trailing excl. mark if token is numeric
		const slug = new Slug(token).toString().replace("!", "");
		const ormSearchToken = slug.split(Slug.separator);
		const ormSearchFilter = ormSearchToken.map((subToken: string) => ({
			contains: subToken,
		}));

		return this.prismaService.song.findMany({
			...buildPaginationParameters(pagination),
			orderBy: sort
				? this.formatSortingInput(sort)
				: {
						_relevance: {
							fields: ["slug"],
							search: slug,
							sort: "asc",
						},
				  },
			include: this.formatInclude(include),
			where: {
				...this.formatManyWhereInput(where),
				OR: [
					...ormSearchFilter.map((filter) => ({ slug: filter })),
					// ...ormSearchFilter.map((filter) => ({ artist: { slug: filter } })),
					// ...ormSearchFilter.map((filter) => ({
					// 	tracks: { some: { release: { slug: filter } } }
					// }))
				],
			},
		});
	}

	/**
	 * Removes all extensions for a song name
	 * An extension is a group of characters in brackets, parenthesis or curly brackets
	 * @param songName the name of the song to strip
	 */
	private getBaseSongName(songName: string): string {
		return this.parserService.stripGroups(songName);
	}
}
