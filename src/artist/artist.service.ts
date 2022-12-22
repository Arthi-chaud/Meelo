import {
	Inject, Injectable, Logger, forwardRef
} from '@nestjs/common';
import Slug from 'src/slug/slug';
import {
	ArtistAlreadyExistsException,
	ArtistNotFoundByIDException,
	ArtistNotFoundException,
	CompilationArtistException
} from './artist.exceptions';
import { Prisma } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import type ArtistQueryParameters from './models/artist.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import SongService from 'src/song/song.service';
import AlbumService from 'src/album/album.service';
import IllustrationService from 'src/illustration/illustration.service';
import SortingParameter from 'src/sort/models/sorting-parameter';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import GenreService from 'src/genre/genre.service';
import ReleaseService from 'src/release/release.service';
import TrackService from 'src/track/track.service';
import type { Artist, ArtistWithRelations } from 'src/prisma/models';
import { ArtistResponse } from './models/artist.response';
import { IllustrationPath } from 'src/illustration/models/illustration-path.model';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import { parseIdentifierSlugs } from 'src/identifier/identifier.parse-slugs';

@Injectable()
export default class ArtistService extends RepositoryService<
	ArtistWithRelations,
	ArtistQueryParameters.CreateInput,
	ArtistQueryParameters.WhereInput,
	ArtistQueryParameters.ManyWhereInput,
	ArtistQueryParameters.UpdateInput,
	ArtistQueryParameters.DeleteInput,
	ArtistQueryParameters.SortingKeys,
	Prisma.ArtistCreateInput,
	Prisma.ArtistWhereInput,
	Prisma.ArtistWhereInput,
	Prisma.ArtistUpdateInput,
	Prisma.ArtistWhereUniqueInput,
	Prisma.ArtistOrderByWithRelationInput
> {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService
	) {
		super(prismaService.artist);
	}

	/**
	 * Artist Creation
	 */
	formatCreateInput(input: ArtistQueryParameters.CreateInput): Prisma.ArtistCreateInput {
		return {
			name: input.name,
			slug: new Slug(input.name).toString()
		};
	}

	protected formatCreateInputToWhereInput(input: ArtistQueryParameters.CreateInput) {
		return { slug: new Slug(input.name) };
	}

	protected onCreationFailure(input: ArtistQueryParameters.CreateInput) {
		return new ArtistAlreadyExistsException(new Slug(input.name));
	}

	/**
	 * Get Artist
	 */
	checkWhereInputIntegrity(input: ArtistQueryParameters.WhereInput): void {
		if (input.compilationArtist) {
			throw new CompilationArtistException('Artist');
		}
	}

	static formatWhereInput(input: ArtistQueryParameters.WhereInput) {
		return {
			id: input.id,
			slug: input.slug?.toString()
		};
	}

	formatWhereInput = ArtistService.formatWhereInput;
	onNotFound(where: ArtistQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined) {
			return new ArtistNotFoundByIDException(where.id);
		}
		return new ArtistNotFoundException(where.slug!);
	}

	/**
	 * Get Artists
	 */
	static formatManyWhereInput(where: ArtistQueryParameters.ManyWhereInput) {
		return {
			id: where.ids ? {
				in: where.ids.in
			} : undefined,
			name: buildStringSearchParameters(where.name),
			albums: where.library ? {
				some: {
					releases: {
						some: ReleaseService
							.formatManyWhereInput({ library: where.library })
					}
				}
			} : undefined,
			songs: where.library || where.genre ? {
				some: {
					genres: where.genre ? {
						some: GenreService.formatWhereInput(where.genre)
					} : undefined,
					tracks: where.library ? {
						some: TrackService
							.formatManyWhereInput({ library: where.library })
					} : undefined
				}
			} : undefined
		};
	}

	formatManyWhereInput = ArtistService.formatManyWhereInput;

	formatIdentifierToWhereInput(identifier: string): ArtistQueryParameters.WhereInput {
		const [slug] = parseIdentifierSlugs(identifier, 1);

		if (slug.toString() == compilationAlbumArtistKeyword) {
			return { compilationArtist: true };
		}
		return { slug };
	}

	formatSortingInput(
		sortingParameter: SortingParameter<ArtistQueryParameters.SortingKeys>
	): Prisma.ArtistOrderByWithRelationInput {
		switch (sortingParameter.sortBy) {
		case 'name':
			return { slug: sortingParameter.order };
		case 'albumCount':
			return { albums: { _count: sortingParameter.order } };
		case 'songCount':
			return { songs: { _count: sortingParameter.order } };
		case 'addDate':
			return { id: sortingParameter.order };
		default:
			return { [sortingParameter.sortBy ?? 'id']: sortingParameter.order };
		}
	}

	/**
	 * Find multiple artists that have at least one album
	 * @param where the query parameters to find the artists
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include in the returned artists
	 */
	async getAlbumsArtists<I extends ArtistQueryParameters.RelationInclude>(
		where: ArtistQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: ArtistQueryParameters.SortingParameter
	) {
		return this.prismaService.artist.findMany({
			where: {
				...this.formatManyWhereInput(where),
				NOT: { albums: { none: {} } }
			},
			include: RepositoryService.formatInclude(include),
			orderBy: sort ? this.formatSortingInput(sort) : undefined,
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Update Artist
	 */
	formatUpdateInput(what: ArtistQueryParameters.UpdateInput) {
		return {
			name: what.name,
			slug: what.name ? new Slug(what.name).toString() : undefined
		};
	}

	/**
	 * Artist deletion
	 */
	formatDeleteInput(where: ArtistQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(input: ArtistQueryParameters.DeleteInput) {
		return input;
	}

	/**
	 * Deletes an artist
	 * @param where the query parameters to find the album to delete
	 */
	async delete(where: ArtistQueryParameters.DeleteInput): Promise<Artist> {
		const artist = await this.get(where, { albums: true, songs: true });

		await Promise.allSettled([
			...artist.albums.map(
				(album) => this.albumService.delete({ id: album.id })
			),
			...artist.songs.map(
				(song) => this.songService.delete({ id: song.id })
			)
		]);
		try {
			await super.delete(where);
		} catch {
			return artist;
		}
		Logger.warn(`Artist '${artist.slug}' deleted`);
		try {
			const artistIllustrationFolder = this.illustrationService
				.buildArtistIllustrationFolderPath(new Slug(artist.slug));

			this.illustrationService.deleteIllustrationFolder(artistIllustrationFolder);
		} catch {
			return artist;
		}
		return artist;
	}

	/**
	 * Deletes an artist if it does not have any album or song
	 * @param where the query parameters to find the artist to delete
	 */
	async deleteArtistIfEmpty(where: ArtistQueryParameters.DeleteInput): Promise<void> {
		const albumCount = await this.albumService.count({ artist: where });
		const songCount = await this.songService.count({ artist: where });

		if (songCount == 0 && albumCount == 0) {
			await this.delete(where);
		}
	}

	/**
	 * Builds the path to the artist's illustration
	 * @param where the query parameters to find the artist
	 * @returns the path of the illustration
	 */
	async buildIllustrationPath(
		where: ArtistQueryParameters.WhereInput
	): Promise<IllustrationPath> {
		const artist = await this.select(where, { slug: true });
		const path = this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug));

		return path;
	}

	/**
	 * Build API reponse for Artist Request
	 * @param artist the Artist to build the response from
	 * @returns the response Object
	 */
	async buildResponse(artist: ArtistWithRelations): Promise<ArtistResponse> {
		const response = <ArtistResponse>{
			...artist,
			illustration: this.illustrationService.getArtistIllustrationLink(new Slug(artist.slug))
		};

		return response;
	}
}
