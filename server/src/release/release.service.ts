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
import AlbumService from "src/album/album.service";
import Slug from "src/slug/slug";
import type { Release, ReleaseWithRelations } from "src/prisma/models";
import { Prisma } from "@prisma/client";
import {
	MasterReleaseNotFoundException,
	ReleaseAlreadyExists,
	ReleaseNotEmptyException,
	ReleaseNotFoundException,
	ReleaseNotFoundFromIDException,
} from "./release.exceptions";
import { basename } from "path";
import PrismaService from "src/prisma/prisma.service";
import type ReleaseQueryParameters from "./models/release.query-parameters";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import TrackService from "src/track/track.service";
import RepositoryService from "src/repository/repository.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import ArtistService from "src/artist/artist.service";
import FileService from "src/file/file.service";
import archiver from "archiver";
// eslint-disable-next-line no-restricted-imports
import { createReadStream } from "fs";
import { Response } from "express";
import mime from "mime";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import { parseIdentifierSlugs } from "src/identifier/identifier.parse-slugs";
import Identifier from "src/identifier/models/identifier";
import Logger from "src/logger/logger";
import { PrismaError } from "prisma-error-enum";
import IllustrationRepository from "src/illustration/illustration.repository";
import DiscogsProvider from "src/providers/discogs/discogs.provider";
import deepmerge from "deepmerge";

@Injectable()
export default class ReleaseService extends RepositoryService<
	ReleaseWithRelations,
	ReleaseQueryParameters.CreateInput,
	ReleaseQueryParameters.WhereInput,
	ReleaseQueryParameters.ManyWhereInput,
	ReleaseQueryParameters.UpdateInput,
	ReleaseQueryParameters.DeleteInput,
	ReleaseQueryParameters.SortingKeys,
	Prisma.ReleaseCreateInput,
	Prisma.ReleaseWhereInput,
	Prisma.ReleaseWhereInput,
	Prisma.ReleaseUpdateInput,
	Prisma.ReleaseWhereUniqueInput,
	Prisma.ReleaseOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(ReleaseService.name);
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private illustrationRepository: IllustrationRepository,
		private discogsProvider: DiscogsProvider,
	) {
		super(prismaService, "release");
	}

	getTableName() {
		return "releases";
	}

	/**
	 * Create
	 */
	async create<I extends ReleaseQueryParameters.RelationInclude>(
		input: ReleaseQueryParameters.CreateInput,
		include?: I | undefined,
	) {
		const release = await super.create(input, include);

		await this.albumService.updateAlbumDate({ id: release.albumId });
		return release;
	}

	formatCreateInput(
		release: ReleaseQueryParameters.CreateInput,
	): Prisma.ReleaseCreateInput {
		return {
			name: release.name,
			registeredAt: release.registeredAt,
			releaseDate: release.releaseDate,
			album: {
				connect: AlbumService.formatWhereInput(release.album),
			},
			externalIds: release.discogsId
				? {
						create: {
							provider: {
								connect: { name: this.discogsProvider.name },
							},
							value: release.discogsId,
						},
				  }
				: undefined,
			slug: new Slug(release.name).toString(),
		};
	}

	protected formatCreateInputToWhereInput(
		input: ReleaseQueryParameters.CreateInput,
	): ReleaseQueryParameters.WhereInput {
		return { bySlug: { slug: new Slug(input.name), album: input.album } };
	}

	protected async onCreationFailure(
		error: Error,
		input: ReleaseQueryParameters.CreateInput,
	) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const parentAlbum = await this.albumService.get(input.album, {
				artist: true,
			});

			if (error.code == PrismaError.UniqueConstraintViolation) {
				return new ReleaseAlreadyExists(
					new Slug(input.name),
					parentAlbum.artist
						? new Slug(parentAlbum.artist!.slug)
						: undefined,
				);
			}
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: ReleaseQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.bySlug?.slug.toString(),
			album: where.bySlug
				? AlbumService.formatWhereInput(where.bySlug.album)
				: undefined,
		};
	}

	formatWhereInput = ReleaseService.formatWhereInput;
	static formatManyWhereInput(where: ReleaseQueryParameters.ManyWhereInput) {
		let query: Prisma.ReleaseWhereInput = {
			name: buildStringSearchParameters(where.name),
		};

		if (where.id) {
			query = deepmerge(query, { id: where.id });
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
				album: {
					id: where.album.id,
					slug: where.album.bySlug?.slug.toString(),
					artist: where.album.bySlug
						? where.album.bySlug?.artist
							? ArtistService.formatWhereInput(
									where.album.bySlug.artist,
							  )
							: null
						: undefined,
				},
			});
		}
		return query;
	}

	formatManyWhereInput = ReleaseService.formatManyWhereInput;

	static formatIdentifierToWhereInput(
		identifier: Identifier,
	): ReleaseQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(
			identifier,
			(stringIdentifier) => {
				const slugs = parseIdentifierSlugs(stringIdentifier, 3);

				return {
					bySlug: {
						slug: slugs[2],
						album: {
							bySlug: {
								slug: slugs[1],
								artist:
									slugs[0].toString() ==
									compilationAlbumArtistKeyword
										? undefined
										: { slug: slugs[0] },
							},
						},
					},
				};
			},
		);
	}

	formatSortingInput(
		sortingParameter: ReleaseQueryParameters.SortingParameter,
	): Prisma.ReleaseOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
			case "name":
				return { slug: sortingParameter.order };
			case "trackCount":
				return { tracks: { _count: sortingParameter.order } };
			case "addDate":
				return { registeredAt: sortingParameter.order };
			case "releaseDate":
				return {
					releaseDate: {
						sort: sortingParameter.order ?? "asc",
						nulls: "last",
					},
				};
			default:
				return {
					[sortingParameter.sortBy ?? "id"]: sortingParameter.order,
				};
		}
	}

	/**
	 * Callback on release not found
	 * @param where the query parameters that failed to get the release
	 */
	async onNotFound(error: Error, where: ReleaseQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.RecordsNotFound
		) {
			if (where.id != undefined) {
				return new ReleaseNotFoundFromIDException(where.id);
			}
			const parentAlbum = await this.albumService.get(
				where.bySlug.album,
				{ artist: true },
			);
			const releaseSlug: Slug = where.bySlug!.slug;
			const parentArtistSlug = parentAlbum.artist?.slug
				? new Slug(parentAlbum.artist.slug)
				: undefined;

			return new ReleaseNotFoundException(
				releaseSlug,
				new Slug(parentAlbum.slug),
				parentArtistSlug,
			);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Fetch the releases from an album
	 * @param where the parameters to find the parent album
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned objects
	 * @returns
	 */
	async getAlbumReleases<I extends ReleaseQueryParameters.RelationInclude>(
		where: AlbumQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: ReleaseQueryParameters.SortingParameter,
	) {
		const releases = await super.getMany(
			{ album: where },
			pagination,
			include,
			sort,
		);

		if (releases.length == 0) {
			await this.albumService.throwIfNotFound(where);
		}
		return releases;
	}

	/**
	 * Fetch the master release of an album
	 * @param where the parameters to find the parent album
	 * @param include the relation to include in the returned objects
	 * @returns
	 */
	async getMasterRelease(
		where: AlbumQueryParameters.WhereInput,
		include?: ReleaseQueryParameters.RelationInclude,
	) {
		return this.albumService.get(where).then(async (album) => {
			if (album.masterId != null) {
				return this.get({ id: album.masterId }, include);
			}
			return this.prismaService.release
				.findFirstOrThrow({
					where: { album: AlbumService.formatWhereInput(where) },
					include: this.formatInclude(include),
					orderBy: { id: "asc" },
				})
				.catch(() => {
					throw new MasterReleaseNotFoundException(
						new Slug(album.slug),
					);
				});
		});
	}

	/**
	 * Update
	 */
	formatUpdateInput(
		what: ReleaseQueryParameters.UpdateInput,
	): Prisma.ReleaseUpdateInput {
		return {
			...what,
			album: what.album
				? {
						connect: AlbumService.formatWhereInput(what.album),
				  }
				: undefined,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		};
	}

	/**
	 * Updates the release in the database
	 * @param what the fields to update in the release
	 * @param where the query parameters to fin the release to update
	 */
	async update(
		what: ReleaseQueryParameters.UpdateInput,
		where: ReleaseQueryParameters.WhereInput,
	) {
		const updatedRelease = await super.update(what, where);

		await this.albumService.updateAlbumDate({ id: updatedRelease.albumId });
		return updatedRelease;
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: ReleaseQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(
		input: ReleaseQueryParameters.DeleteInput,
	) {
		return input;
	}

	/**
	 * Deletes a release
	 * Also delete related tracks.
	 * @param where Query parameters to find the release to delete
	 */
	async delete(where: ReleaseQueryParameters.DeleteInput): Promise<Release> {
		await this.illustrationRepository.deleteReleaseIllustration(where, {
			withFolder: true,
		});
		return super.delete(where).then((deleted) => {
			this.logger.warn(`Release '${deleted.slug}' deleted`);
			return deleted;
		});
	}

	onDeletionFailure(error: Error, input: ReleaseQueryParameters.DeleteInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.ForeignConstraintViolation
		) {
			return new ReleaseNotEmptyException(input.id);
		}
		return super.onDeletionFailure(error, input);
	}

	/**
	 * Calls 'delete' on all releases that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptyReleases = await this.prismaService.release
			.findMany({
				select: {
					id: true,
					_count: {
						select: { tracks: true },
					},
				},
			})
			.then((releases) =>
				releases.filter((release) => !release._count.tracks),
			);

		await Promise.all(emptyReleases.map(({ id }) => this.delete({ id })));
	}

	/**
	 * Reassign a release to an album
	 * @param releaseWhere the query parameters to find the release to reassign
	 * @param albumWhere the query parameters to find the album to reassign the release to
	 */
	async reassign(
		releaseWhere: ReleaseQueryParameters.WhereInput,
		albumWhere: AlbumQueryParameters.WhereInput,
	): Promise<Release> {
		const release = await this.get(releaseWhere);
		const oldAlbum = await this.albumService.get(
			{ id: release.albumId },
			{ artist: true },
		);
		const newParent = await this.albumService.get(albumWhere, {
			releases: true,
			artist: true,
		});

		if (
			newParent.releases.find(
				(newParentRelease) => newParentRelease.slug == release.slug,
			)
		) {
			throw new ReleaseAlreadyExists(
				new Slug(release.slug),
				newParent.artist ? new Slug(newParent.artist.slug) : undefined,
			);
		}
		if (oldAlbum.masterId == release.id) {
			await this.albumService.unsetMasterRelease(releaseWhere);
		}
		const updatedRelease = await this.update(
			{ album: albumWhere },
			releaseWhere,
		);

		this.illustrationRepository.reassignReleaseIllustration(
			release.slug,
			oldAlbum.slug,
			newParent.slug,
			oldAlbum.artist?.slug ?? undefined,
			newParent.artist?.slug ?? undefined,
		);
		return updatedRelease;
	}

	async pipeArchive(where: ReleaseQueryParameters.WhereInput, res: Response) {
		const release = await this.prismaService.release
			.findFirstOrThrow({
				where: this.formatWhereInput(where),
				include: { tracks: true, album: { include: { artist: true } } },
			})
			.catch(async (err) => {
				throw await this.onNotFound(err, where);
			});
		const illustration =
			await this.illustrationRepository.getReleaseIllustrationResponse(
				where,
			);
		const archive = archiver("zip");
		const outputName = `${release.slug}.zip`;

		await Promise.all(
			release.tracks.map((track) =>
				this.fileService.buildFullPath({ id: track.sourceFileId }),
			),
		).then((paths) =>
			paths.forEach((path) => {
				archive.append(createReadStream(path), {
					name: basename(path),
				});
			}),
		);
		if (illustration) {
			const illustrationPath =
				await this.illustrationRepository.resolveReleaseIllustrationPath(
					illustration.id,
				);

			archive.append(createReadStream(illustrationPath), {
				name: basename(illustrationPath),
			});
		}

		res.set({
			"Content-Disposition": `attachment; filename="${outputName}"`,
			"Content-Type":
				mime.getType(outputName) ?? "application/octet-stream",
		});
		archive.pipe(res);
		archive.finalize();
	}
}
