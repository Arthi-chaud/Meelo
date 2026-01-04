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

import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { Prisma } from "src/prisma/generated/client";
import archiver from "archiver";
import type { Response } from "express";
import mime from "mime";
import { PrismaError } from "prisma-error-enum";
import AlbumService from "src/album/album.service";
import type AlbumQueryParameters from "src/album/models/album.query-parameters";
import compilationAlbumArtistKeyword from "src/constants/compilation";
import { UnhandledORMErrorException } from "src/exceptions/orm-exceptions";
import FileService from "src/file/file.service";
import { filterToPrisma } from "src/filter/filter";
import IllustrationRepository from "src/illustration/illustration.repository";
import LabelService from "src/label/label.service";
import Logger from "src/logger/logger";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import PrismaService from "src/prisma/prisma.service";
import {
	formatIdentifierToIdOrSlug,
	formatPaginationParameters,
} from "src/repository/repository.utils";
import Slug from "src/slug/slug";
import TrackService from "src/track/track.service";
import { buildStringSearchParameters } from "src/utils/search-string-input";
import type ReleaseQueryParameters from "./models/release.query-parameters";
import {
	MasterReleaseNotFoundException,
	ReleaseAlreadyExists,
	ReleaseNotEmptyException,
	ReleaseNotFoundException,
} from "./release.exceptions";

@Injectable()
export default class ReleaseService {
	private readonly logger = new Logger(ReleaseService.name);
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private illustrationRepository: IllustrationRepository,
	) {}

	/**
	 * Create
	 */
	async create<I extends ReleaseQueryParameters.RelationInclude>(
		input: ReleaseQueryParameters.CreateInput,
		include?: I | undefined,
	) {
		const album = await this.albumService.get(input.album, {
			artist: true,
		});
		const releaseNameSlug = new Slug(
			input.name,
			...input.extensions,
		).toString();
		const uniqueSlug = new Slug(
			album.artist?.slug ?? compilationAlbumArtistKeyword,
			releaseNameSlug,
		).toString();
		const args = {
			data: {
				name: input.name,
				slug: uniqueSlug,
				nameSlug: releaseNameSlug,
				registeredAt: input.registeredAt,
				releaseDate: input.releaseDate,
				extensions: input.extensions,
				album: { connect: { id: album.id } },
				label: input.label
					? {
							connect: LabelService.formatWhereInput(input.label),
						}
					: undefined,
				externalMetadata: input.discogsId
					? {
							create: {
								sources: {
									create: {
										provider: {
											connectOrCreate: {
												where: { slug: "discogs" },
												create: {
													name: "Discogs",
													// This is a hotfix while rewriting external metadata.
													slug: "discogs",
												},
											},
										},
										url: `https://www.discogs.com/release/${input.discogsId}`,
									},
								},
							},
						}
					: undefined,
			},
			include: include ?? ({} as I),
		};
		const release = await this.prismaService.release
			.create<Prisma.SelectSubset<typeof args, Prisma.ReleaseCreateArgs>>(
				args,
			)
			.catch(async (error) => {
				if (error instanceof Prisma.PrismaClientKnownRequestError) {
					const parentAlbum = await this.albumService.get(
						input.album,
						{
							artist: true,
						},
					);

					if (error.code === PrismaError.UniqueConstraintViolation) {
						throw new ReleaseAlreadyExists(
							new Slug(input.name),
							parentAlbum.artist
								? new Slug(parentAlbum.artist!.slug)
								: undefined,
						);
					}
				}
				throw new UnhandledORMErrorException(error, input);
			});

		await this.albumService.updateAlbumDate({ id: release.albumId });
		return release;
	}

	async getOrCreate<I extends ReleaseQueryParameters.RelationInclude = {}>(
		input: ReleaseQueryParameters.CreateInput,
		include?: I,
	) {
		try {
			const album = await this.albumService.get(input.album, {
				artist: true,
			});
			const releaseNameSlug = new Slug(
				input.name,
				...input.extensions,
			).toString();
			const uniqueSlug = new Slug(
				album.artist?.slug ?? compilationAlbumArtistKeyword,
				releaseNameSlug,
			);
			return await this.get({ slug: uniqueSlug }, include);
		} catch {
			return this.create(input, include);
		}
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: ReleaseQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.slug?.toString(),
		};
	}

	static formatManyWhereInput(where: ReleaseQueryParameters.ManyWhereInput) {
		const query: Prisma.ReleaseWhereInput[] = [
			{
				name: buildStringSearchParameters(where.name),
			},
		];

		if (where.releases) {
			query.push({
				OR: where.releases.map((release) =>
					ReleaseService.formatWhereInput(release),
				),
			});
		}
		if (where.library) {
			query.push({
				tracks: {
					some: TrackService.formatManyWhereInput({
						library: where.library,
					}),
				},
			});
		}
		if (where.album) {
			query.push({
				album: filterToPrisma(
					where.album,
					AlbumService.formatWhereInput,
				),
			});
		}
		if (where.label) {
			query.push({
				AND: filterToPrisma(where.label, (t) => ({
					label: t ? LabelService.formatWhereInput(t) : undefined,
				})),
			});
		}
		return { AND: query };
	}

	static formatIdentifierToWhereInput = formatIdentifierToIdOrSlug;

	formatSortingInput(
		sortingParameter: ReleaseQueryParameters.SortingParameter,
	): Prisma.ReleaseOrderByWithRelationInput[] {
		sortingParameter.order ??= "asc";
		switch (sortingParameter.sortBy) {
			case "name":
				return [
					{ nameSlug: sortingParameter.order },
					{ album: { artist: { slug: "asc" } } },
					{ releaseDate: { sort: "asc", nulls: "last" } },
					{ tracks: { _count: "asc" } },
					{ id: "asc" },
				];
			case "trackCount":
				return [
					{ tracks: { _count: sortingParameter.order } },
					{ nameSlug: "asc" },
					{ album: { artist: { slug: "asc" } } },
					{ releaseDate: { sort: "asc", nulls: "last" } },
					{ id: "asc" },
				];
			case "addDate":
				return [
					{ registeredAt: sortingParameter.order },
					{ nameSlug: "asc" },
					{ album: { artist: { slug: "asc" } } },
					{ releaseDate: { sort: "asc", nulls: "last" } },
					{ tracks: { _count: "asc" } },
					{ id: "asc" },
				];
			case "releaseDate":
				return [
					{
						releaseDate: {
							sort: sortingParameter.order,
							nulls: "last",
						},
					},
					{ nameSlug: "asc" },
					{ album: { artist: { slug: "asc" } } },
					{ tracks: { _count: "asc" } },
					{ id: "asc" },
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

	async get<I extends ReleaseQueryParameters.RelationInclude = {}>(
		where: ReleaseQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			where: ReleaseService.formatWhereInput(where),
			include: include ?? ({} as I),
		};
		return this.prismaService.release
			.findFirstOrThrow<
				Prisma.SelectSubset<
					typeof args,
					Prisma.ReleaseFindFirstOrThrowArgs
				>
			>(args)
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});
	}

	async getMany<I extends ReleaseQueryParameters.RelationInclude = {}>(
		where: ReleaseQueryParameters.ManyWhereInput,
		sort?: ReleaseQueryParameters.SortingParameter,
		pagination?: PaginationParameters,
		include?: I,
	) {
		const args = {
			include: include ?? ({} as I),
			where: ReleaseService.formatManyWhereInput(where),
			orderBy:
				sort === undefined ? undefined : this.formatSortingInput(sort),
			...formatPaginationParameters(pagination),
		};
		const releases =
			await this.prismaService.release.findMany<
				Prisma.SelectSubset<typeof args, Prisma.ReleaseFindManyArgs>
			>(args);
		return releases;
	}

	/**
	 * Callback on release not found
	 * @param where the query parameters that failed to get the release
	 */
	async onNotFound(error: Error, where: ReleaseQueryParameters.WhereInput) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === PrismaError.RecordsNotFound
		) {
			return new ReleaseNotFoundException(where.id ?? where.slug);
		}
		return new UnhandledORMErrorException(error, where);
	}

	/**
	 * Fetch the master release of an album
	 * @param where the parameters to find the parent album
	 * @param include the relation to include in the returned objects
	 * @returns
	 */
	async getMasterRelease<I extends ReleaseQueryParameters.RelationInclude>(
		where: AlbumQueryParameters.WhereInput,
		include?: I,
	) {
		const args = {
			where: { album: AlbumService.formatWhereInput(where) },
			include: include ?? ({} as I),
			orderBy: { id: "asc" as const },
		};
		return this.albumService.get(where).then(async (album) => {
			if (album.masterId !== null) {
				return this.get({ id: album.masterId }, include);
			}
			return this.prismaService.release
				.findFirstOrThrow<
					Prisma.SelectSubset<
						typeof args,
						Prisma.ReleaseFindFirstOrThrowArgs
					>
				>(args)
				.catch(() => {
					throw new MasterReleaseNotFoundException(
						new Slug(album.slug),
					);
				});
		});
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
		const updatedRelease = await this.prismaService.release
			.update({
				data: {
					...what,
				},
				where: ReleaseService.formatWhereInput(where),
			})
			.catch(async (error) => {
				throw await this.onNotFound(error, where);
			});

		await this.albumService.updateAlbumDate({ id: updatedRelease.albumId });
		return updatedRelease;
	}

	/**
	 * Delete releases
	 * @param where Query parameters to find the releases to delete
	 */
	async delete(where: ReleaseQueryParameters.DeleteInput[]) {
		if (!where.length) {
			return 0;
		}
		const toDelete = await this.getMany(
			{ releases: where },
			undefined,
			undefined,
			{ tracks: true },
		);
		for (const release of toDelete) {
			if (release.tracks.length > 0) {
				throw new ReleaseNotEmptyException(release.id);
			}
		}
		await Promise.allSettled(
			toDelete.map((release) =>
				this.illustrationRepository
					.getReleaseIllustrations({ id: release.id })
					.then((relatedIllustrations) =>
						Promise.allSettled(
							relatedIllustrations.map(({ illustration }) =>
								this.illustrationRepository.deleteIllustration(
									illustration.id,
								),
							),
						),
					),
			),
		);

		return this.prismaService.release
			.deleteMany({
				where: ReleaseService.formatManyWhereInput({ releases: where }),
			})
			.catch((error) => {
				throw new UnhandledORMErrorException(error, where);
			})
			.then((res) => res.count);
	}

	/**
	 * Calls 'delete' on all releases that do not have tracks
	 */
	async housekeeping(): Promise<void> {
		const emptyReleases = await this.prismaService.release.findMany({
			select: {
				id: true,
				_count: {
					select: { tracks: true },
				},
			},
			where: { tracks: { none: {} } },
		});
		const deletedReleaseCount =
			emptyReleases.length > 0
				? await this.delete(emptyReleases.map(({ id }) => ({ id })))
				: 0;
		if (deletedReleaseCount) {
			this.logger.warn(`Deleted ${deletedReleaseCount} releases`);
		}
	}

	async pipeArchive(where: ReleaseQueryParameters.WhereInput, res: Response) {
		const release = await this.prismaService.release
			.findFirstOrThrow({
				where: ReleaseService.formatWhereInput(where),
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
		).then((paths) => {
			for (const path of paths) {
				archive.append(createReadStream(path), {
					name: basename(path),
				});
			}
		});
		if (illustration) {
			const illustrationPath =
				this.illustrationRepository.buildIllustrationPath(
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
