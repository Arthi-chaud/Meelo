import {
	Inject, Injectable, forwardRef
} from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import {
	AlbumAlreadyExistsException,
	AlbumAlreadyExistsWithArtistIDException,
	AlbumNotEmptyException,
	AlbumNotFoundException,
	AlbumNotFoundFromIDException
} from './album.exceptions';
import { AlbumType, Prisma } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import AlbumQueryParameters from './models/album.query-parameters';
import type ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import ReleaseService from 'src/release/release.service';
import RepositoryService from 'src/repository/repository.service';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import SongService from 'src/song/song.service';
import { Album, AlbumWithRelations } from "src/prisma/models";
import { parseIdentifierSlugs } from 'src/identifier/identifier.parse-slugs';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import Identifier from 'src/identifier/models/identifier';
import Logger from 'src/logger/logger';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import { PrismaError } from 'prisma-error-enum';
import { PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import IllustrationRepository from 'src/illustration/illustration.repository';

@Injectable()
export default class AlbumService extends RepositoryService<
	AlbumWithRelations,
	AlbumQueryParameters.CreateInput,
	AlbumQueryParameters.WhereInput,
	AlbumQueryParameters.ManyWhereInput,
	AlbumQueryParameters.UpdateInput,
	AlbumQueryParameters.DeleteInput,
	AlbumQueryParameters.SortingKeys,
	Prisma.AlbumCreateInput,
	Prisma.AlbumWhereInput,
	Prisma.AlbumWhereInput,
	Prisma.AlbumUpdateInput,
	Prisma.AlbumWhereUniqueInput,
	Prisma.AlbumOrderByWithRelationAndSearchRelevanceInput
> {
	private readonly logger = new Logger(AlbumService.name);
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistServce: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		private illustrationRepository: IllustrationRepository
	) {
		super(prismaService.album);
	}

	/**
	 * Create an Album
	 */
	async create<I extends AlbumQueryParameters.RelationInclude>(
		album: AlbumQueryParameters.CreateInput,
		include?: I
	) {
		if (album.artist === undefined) {
			if (await this.count(
				{ name: { is: album.name }, artist: { compilationArtist: true } }
			) != 0) {
				throw new AlbumAlreadyExistsException(new Slug(album.name));
			}
		}
		return super.create(album, include);
	}

	formatCreateInput(input: AlbumQueryParameters.CreateInput) {
		return {
			name: input.name,
			artist: input.artist ? {
				connect: ArtistService.formatWhereInput(input.artist)
			} : undefined,
			slug: new Slug(input.name).toString(),
			releaseDate: input.releaseDate,
			registeredAt: input.registeredAt,
			type: AlbumService.getAlbumTypeFromName(input.name)
		};
	}

	protected formatCreateInputToWhereInput(where: AlbumQueryParameters.CreateInput) {
		return {
			bySlug: { slug: new Slug(where.name), artist: where.artist },
		};
	}

	protected async onCreationFailure(error: Error, input: AlbumQueryParameters.CreateInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const albumSlug = new Slug(input.name);

			if (input.artist) {
				await this.artistServce.get(input.artist);
			}
			if (error.code == PrismaError.UniqueConstraintViolation) {
				if (input.artist?.id) {
					return new AlbumAlreadyExistsWithArtistIDException(albumSlug, input.artist.id);
				}
				return new AlbumAlreadyExistsException(albumSlug, input.artist?.slug);
			}
		}
		return this.onUnknownError(error, input);
	}

	/**
	 * Find an album
	 */
	static formatWhereInput(where: AlbumQueryParameters.WhereInput) {
		return {
			id: where.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug ?
				where.bySlug.artist
					? ArtistService.formatWhereInput(where.bySlug.artist)
					: null
				: undefined
		};
	}

	formatWhereInput = AlbumService.formatWhereInput;

	static formatManyWhereInput(where: AlbumQueryParameters.ManyWhereInput) {
		return {
			NOT: where.related ? this.formatWhereInput(where.related) : undefined,
			type: where.type,
			artist: {
				is: where.artist
					? where.artist.compilationArtist
						? null
						: ArtistService.formatWhereInput(where.artist)
					: where.artist,
				isNot: where.appearance
					? ArtistService.formatWhereInput(where.appearance)
					: undefined
			},
			name: buildStringSearchParameters(where.name),
			releases: where.library || where.genre || where.appearance || where.related ? {
				some: where.library
					? ReleaseService.formatManyWhereInput({ library: where.library })
					: where.genre
						? {
							tracks: {
								some: {
									song: SongService.formatManyWhereInput({ genre: where.genre })
								}
							}
						}
						: where.appearance
							? {
								tracks: { some: {
									song: {
										artist: ArtistService.formatWhereInput(where.appearance)
									}
								} }
							}
							: where.related
								? {
									tracks: {
										some: {
											song: {
												tracks: {
													some: {
														release: {
															album:
																this.formatWhereInput(where.related)
														}
													}

												}
											}
										}
									}
								} : undefined
			} : undefined
		};
	}

	formatManyWhereInput = AlbumService.formatManyWhereInput;

	static formatIdentifierToWhereInput(identifier: Identifier): AlbumQueryParameters.WhereInput {
		return RepositoryService.formatIdentifier(identifier, (stringIdentifier) => {
			const slugs = parseIdentifierSlugs(stringIdentifier, 2);

			return {
				bySlug: {
					slug: slugs[1],
					artist: slugs[0].toString() == compilationAlbumArtistKeyword
						? undefined
						: {	slug: slugs[0] }
				}
			};
		});
	}

	formatSortingInput(
		sortingParameter: AlbumQueryParameters.SortingParameter
	): Prisma.AlbumOrderByWithRelationAndSearchRelevanceInput {
		switch (sortingParameter.sortBy) {
		case 'name':
			return { slug: sortingParameter.order };
		case 'artistName':
			return { artist: this.artistServce.formatSortingInput(
				{ sortBy: 'name', order: sortingParameter.order }
			) };
		case 'addDate':
			return { registeredAt: sortingParameter.order };
		case 'releaseDate':
			return { releaseDate: { sort: sortingParameter.order, nulls: 'last' } };
		default:
			return { [sortingParameter.sortBy ?? 'id']: sortingParameter.order };
		}
	}

	/**
	 * Updates an album
	 */
	formatUpdateInput(what: AlbumQueryParameters.UpdateInput) {
		return {
			...what,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		};
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	async updateAlbumDate(where: AlbumQueryParameters.WhereInput) {
		const album = await this.get(where, { releases: true });

		for (const release of album.releases) {
			if (album.releaseDate == null ||
				release.releaseDate && release.releaseDate < album.releaseDate) {
				album.releaseDate = release.releaseDate;
			}
		}
		return this.update({ releaseDate: album.releaseDate }, { id: album.id });
	}

	/**
	 * Deletes an album
	 * @param where the query parameter
	 */
	async delete(where: AlbumQueryParameters.DeleteInput): Promise<Album> {
		await this.illustrationRepository.deleteAlbumIllustrations(where);
		const album = await super.delete(where);

		this.logger.warn(`Album '${album.slug}' deleted`);
		return album;
	}

	onDeletionFailure(error: Error, input: AlbumQueryParameters.DeleteInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code == PrismaError.ForeignConstraintViolation) {
			return new AlbumNotEmptyException(input.id);
		}
		return super.onDeletionFailure(error, input);
	}

	formatDeleteInput(where: AlbumQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(input: AlbumQueryParameters.DeleteInput) {
		return input;
	}

	/**
	 * Delete all albums that do not have relaed releases
	 */
	async housekeeping(): Promise<void> {
		const emptyAlbums = await this.prismaService.album.findMany({
			select: {
				id: true,
				_count: {
					select: { releases: true }
				}
			}
		}).then((albums) => albums.filter(
			(album) => !album._count.releases
		));

		await Promise.all(
			emptyAlbums.map(({ id }) => this.delete({ id }))
		);
	}

	/**
	 * Set the release as album's master
	 * @param releaseWhere the query parameters of the release
	 * @returns the updated album
	 */
	async setMasterRelease(
		releaseWhere: ReleaseQueryParameters.WhereInput
	) {
		const release = await this.releaseService.select(releaseWhere, { id: true, albumId: true });

		return this.prismaService.album.update({
			where: { id: release.albumId },
			data: { masterId: release.id }
		});
	}

	/**
	 * unset album's master release
	 * @param albumWhere the query parameters of the album
	 * @returns the updated album
	 */
	async unsetMasterRelease(
		albumWhere: AlbumQueryParameters.WhereInput
	) {
		return this.prismaService.album.update({
			where: AlbumService.formatWhereInput(albumWhere),
			data: { masterId: null }
		});
	}

	/**
	 * Change an album's artist
	 * @param albumWhere the query parameters to find the album to reassign
	 * @param artistWhere the query parameters to find the artist to reassign the album to
	 */
	async reassign(
		albumWhere: AlbumQueryParameters.WhereInput, artistWhere: ArtistQueryParameters.WhereInput
	): Promise<Album> {
		const album = await this.get(albumWhere, { artist: true });
		const previousArtistSlug = album.artist ? new Slug(album.artist.slug) : undefined;
		const albumSlug = new Slug(album.slug);
		const newArtist = artistWhere.compilationArtist
			? null
			: await this.artistServce.get(artistWhere, { albums: true });
		const newArtistSlug = newArtist ? new Slug(newArtist.slug) : undefined;
		const artistAlbums = newArtist
			? newArtist.albums
			: await this.getMany({ artist: { compilationArtist: true } });

		//Check if an album with the same name already exist for the new artist
		if (artistAlbums.find((artistAlbum) => album.slug == artistAlbum.slug)) {
			throw new AlbumAlreadyExistsException(albumSlug, newArtistSlug);
		}
		const updatedAlbum = await this.update({ artistId: newArtist?.id ?? null }, albumWhere);

		this.illustrationRepository.reassignAlbumIllustration(
			albumSlug.toString(), previousArtistSlug?.toString(), newArtistSlug?.toString()
		);
		return updatedAlbum;
	}

	async onNotFound(error: Error, where: AlbumQueryParameters.WhereInput) {
		if (error instanceof Prisma.PrismaClientKnownRequestError
			&& error.code == PrismaError.RecordsNotFound) {
			if (where.id != undefined) {
				return new AlbumNotFoundFromIDException(where.id);
			}
			if (where.bySlug.artist) {
				await this.artistServce.throwIfNotFound(where.bySlug.artist);
			}
			return new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artist?.slug);
		}
		return this.onUnknownError(error, where);
	}

	/**
	 * Search for albums using a token.
	 * To match, the albums's slug, or its artist's, or one of its releases's song must match the token
	 */
	public async search<I extends AlbumQueryParameters.RelationInclude>(
		token: string,
		where: AlbumQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: AlbumQueryParameters.SortingParameter
	) {
		if (token.length == 0) {
			return [];
		}
		// Transforms the toke into a slug, and remove trailing excl. mark if token is numeric
		const slug = new Slug(token).toString().replace('!', '');
		const ormSearchToken = slug.split(Slug.separator);
		const ormSearchFilter = ormSearchToken.map((subToken: string) => ({ contains: subToken }));

		return this.prismaService.album.findMany({
			...buildPaginationParameters(pagination),
			orderBy: sort ? this.formatSortingInput(sort) : {
				_relevance: {
					fields: ['slug'],
					search: slug,
					sort: 'asc'
				}
			},
			include: RepositoryService.formatInclude(include),
			where: {
				...this.formatManyWhereInput(where),
				OR: [
					...ormSearchFilter.map((filter) => ({ slug: filter })),
					// ...ormSearchFilter.map((filter) => ({ artist: { slug: filter } })),
					// ...ormSearchFilter.map((filter) => ({
					// 	releases: { some: { tracks: { some: { song: { slug: filter } } } } }
					// }))
				]
			}
		});
	}

	static getAlbumTypeFromName(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.includes('soundtrack') ||
			albumName.includes('from the motion picture') ||
			albumName.includes('bande originale') ||
			albumName.includes('music from and inspired by the television series') ||
			albumName.includes('music from and inspired by the motion picture')) {
			return AlbumType.Soundtrack;
		}
		if (albumName.includes('music videos') ||
			albumName.includes('the video') ||
			albumName.includes('dvd')) {
			return AlbumType.VideoAlbum;
		}
		if (albumName.search(/.+(live).*/g) != -1 ||
			albumName.includes('unplugged') ||
			albumName.includes(' tour') ||
			albumName.includes('live from ') ||
			albumName.includes('live at ') ||
			albumName.includes('live à ')) {
			return AlbumType.LiveRecording;
		}
		if (albumName.endsWith('- single') ||
			albumName.endsWith('- ep') ||
			albumName.endsWith('(remixes)')) {
			return AlbumType.Single;
		}
		if (
			albumName.includes('remix album') ||
			albumName.includes(' the remixes') ||
			albumName.includes('mixes') ||
			albumName.includes('remixes') ||
			albumName.includes('remixed') ||
			albumName.includes('best mixes')) {
			return AlbumType.RemixAlbum;
		}
		if (albumName.includes('best of') ||
			albumName.includes('hits') ||
			albumName.includes('greatest hits') ||
			albumName.includes('singles') ||
			albumName.includes('collection')) {
			return AlbumType.Compilation;
		}
		return AlbumType.StudioRecording;
	}
}
