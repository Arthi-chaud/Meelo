import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import Slug from 'src/slug/slug';
import { ArtistAlreadyExistsException as ArtistAlreadyExistsException, ArtistNotFoundByIDException, ArtistNotFoundException, CompilationArtistException } from './artist.exceptions';
import type { Album, Artist, Song } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import ArtistController from './artist.controller';
import { UrlGeneratorService } from 'nestjs-url-generator';
import SongService from 'src/song/song.service';
import AlbumService from 'src/album/album.service';
import IllustrationService from 'src/illustration/illustration.service';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';

@Injectable()
export default class ArtistService extends RepositoryService<
	Artist,
	ArtistQueryParameters.CreateInput,
	ArtistQueryParameters.WhereInput,
	ArtistQueryParameters.ManyWhereInput,
	ArtistQueryParameters.UpdateInput,
	ArtistQueryParameters.DeleteInput,
	ArtistQueryParameters.RelationInclude,
	ArtistQueryParameters.SortingParameter,
	Artist & { illustration: string }
> {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => UrlGeneratorService))
		private readonly urlGeneratorService: UrlGeneratorService,
		private illustrationService: IllustrationService
	) {
		super();
	}
	
	/**
	 * Creates an Artist
	 * @param artist the parameters needed to create an artist
	 * @param include the relation to include in the returned Artist
	 * @returns 
	 */
	async create(
		artist: ArtistQueryParameters.CreateInput,
		include?: ArtistQueryParameters.RelationInclude
	) {
		const artistSlug = new Slug(artist.name);
		try {
			return await this.prismaService.artist.create({
				data: {
					name: artist.name,
					slug: artistSlug.toString()
				},
				include: ArtistQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw new ArtistAlreadyExistsException(artistSlug);
		}
	}

	/**
	 * Find an artist
	 * @param where the query parameters to find the artist
	 * @param include the relations to include in the returned artist
	 */
	async get(
		where: ArtistQueryParameters.WhereInput,
		include?: ArtistQueryParameters.RelationInclude
	) {
		if (where.compilationArtist)
			throw new CompilationArtistException('Artist');
		try {
			return await this.prismaService.artist.findUnique({
				rejectOnNotFound: true,
				where: ArtistQueryParameters.buildQueryParametersForOne(where),
				include: ArtistQueryParameters.buildIncludeParameters(include),
			});
		} catch {
			throw this.onNotFound(where)
		}
	}

	/**
	 * Find an artist and only return specified fields
	 * @param where the parameters to find the artist 
	 * @param select the fields to return
	 * @returns the select fields of an object
	 */
	async select(
		where: ArtistQueryParameters.WhereInput,
		select: Partial<Record<keyof Artist, boolean>>
	) {
		try {
			return await this.prismaService.artist.findFirst({
				rejectOnNotFound: true,
				where: ArtistQueryParameters.buildQueryParametersForOne(where),
				select: select
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Find multiple artists
	 * @param where the query parameters to find the artists
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include in the returned artists
	 */
	 async getMany(
		where: ArtistQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: ArtistQueryParameters.RelationInclude,
		sort?: ArtistQueryParameters.SortingParameter
	) {
		return this.prismaService.artist.findMany({
			where: ArtistQueryParameters.buildQueryParametersForMany(where),
			include: ArtistQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Find multiple artists that have at least one album
	 * @param where the query parameters to find the artists
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include in the returned artists
	 */
	async getAlbumsArtists(
		where: ArtistQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: ArtistQueryParameters.RelationInclude,
		sort?: ArtistQueryParameters.SortingParameter
	) {
		return this.prismaService.artist.findMany({
			where: {
				...ArtistQueryParameters.buildQueryParametersForMany(where),
				NOT: { albums: { none: {} } }
			},
			include: ArtistQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Count the artists that match the query parameters
	 * @param where the query parameters
	 */
	async count(where: ArtistQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.artist.count({
			where: ArtistQueryParameters.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Updates an Artist
	 * @param what the fields to update
	 * @param where the query parameter to find the artist to update
	 * @returns the updated artist
	 */
	async update(
		what: ArtistQueryParameters.UpdateInput,
		where: ArtistQueryParameters.WhereInput
	): Promise<Artist> {
		if (where.compilationArtist)
			throw new CompilationArtistException('Artist');
		try {
			return await this.prismaService.artist.update({
				data: {
					name: what.name,
					slug: what.name ? new Slug(what.name).toString() : undefined
				},
				where: ArtistQueryParameters.buildQueryParametersForOne(where),
			});
		} catch {
			throw this.onNotFound(where)
		}
	}

	/**
	 * Deletes an artist
	 * @param where the query parameters to find the album to delete
	 */
	async delete(where: ArtistQueryParameters.DeleteInput): Promise<Artist> {
		let artist = await this.get(where, { albums: true, songs: true });
		await Promise.allSettled([
			...artist.albums.map(
				(album) => this.albumService.delete({ byId: { id: album.id } })
			),
			...artist.songs.map(
				(song) => this.songService.delete({ byId: { id: song.id } })
			)
		]);
		try {
			await this.prismaService.artist.delete({
				where: ArtistQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			return artist;
		}
		Logger.warn(`Artist '${artist.slug}' deleted`);
		try {
			const artistIllustrationFolder = this.illustrationService.buildArtistIllustrationFolderPath(
				new Slug(artist.slug)
			);
			this.illustrationService.deleteIllustrationFolder(artistIllustrationFolder);
		} catch {}
		return artist;
	}

	/**
	 * Deletes an artist if it does not have any album or song
	 * @param where the query parameters to find the artist to delete
	 */
	async deleteArtistIfEmpty(where: ArtistQueryParameters.DeleteInput): Promise<void> {
		const albumCount = await this.albumService.count({ byArtist: where });
		const songCount = await this.songService.count({ artist: where });
		if (songCount == 0 && albumCount == 0)
			await this.delete(where);
	}

	/**
	 * Find an artist by its name, or creates one if not found
	 * @param where the query parameters to find / create the artist
	 */
	async getOrCreate(
		where: ArtistQueryParameters.GetOrCreateInput,
		include?: ArtistQueryParameters.RelationInclude
	) {
		try {
			return await this.get({ slug: new Slug(where.name) }, include);
		} catch {
			return this.create(where, include);
		}
	}

	onNotFound(where: ArtistQueryParameters.WhereInput): MeeloException {
		if (where.id !== undefined)
			return new ArtistNotFoundByIDException(where.id);
		return new ArtistNotFoundException(where.slug!);
	}
	
	/**
	 * Build API reponse for Artist Request
	 * @param artist the Artist to build the response from
	 * @returns the response Object
	 */
	buildResponse<ResponseType extends Artist & { illustration: string }> (
		artist: Artist & Partial<{ songs: Song[], albums: Album[] }>
	): ResponseType {
		let response = <ResponseType>{
			...artist,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: ArtistController,
				controllerMethod: ArtistController.prototype.getArtistIllustration,
				params: {
					idOrSlug: artist.id.toString()
				}
			})
		};
		if (artist.songs != undefined)
			response = {
				...response,
				songs: artist.songs.map(
					(song) => this.songService.buildResponse(song)
				)
			}
		if (artist.albums != undefined)
			response = {
				...response,
				albums: artist.albums.map(
					(album) => this.albumService.buildResponse(album)
				)
			}
		return response;
	}
}
