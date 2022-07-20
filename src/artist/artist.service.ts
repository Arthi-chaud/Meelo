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

@Injectable()
export default class ArtistService {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => UrlGeneratorService))
		private readonly urlGeneratorService: UrlGeneratorService,
		private illustrationService: IllustrationService
	) {}
	
	/**
	 * Creates an Artist
	 * @param artist the parameters needed to create an artist
	 * @param include the relation to include in the returned Artist
	 * @returns 
	 */
	async createArtist(
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
	async getArtist(
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
			if (where.id !== undefined)
				throw new ArtistNotFoundByIDException(where.id);
			throw new ArtistNotFoundException(where.slug);
		}
	}

	/**
	 * Find multiple artist
	 * @param where the query parameters to find the artists
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include in the returned artists
	 */
	 async getArtists(
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
	 * Count the artists that match the query parameters
	 * @param where the query parameters
	 */
	async countArtists(where: ArtistQueryParameters.ManyWhereInput): Promise<number> {
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
	async updateArtist(
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
			if (where.id !== undefined)
				throw new ArtistNotFoundByIDException(where.id);
			throw new ArtistNotFoundException(where.slug);
		}
	}

	/**
	 * Deletes an artist
	 * @param where the query parameters to find the album to delete
	 */
	async deleteArtist(where: ArtistQueryParameters.WhereInput): Promise<void> {
		let deletedArtist: Artist;
		if (where.compilationArtist)
			throw new CompilationArtistException('Artist');
		try {
			deletedArtist = await this.prismaService.artist.delete({
				where: ArtistQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			if (where.id !== undefined)
			throw new ArtistNotFoundByIDException(where.id);
			throw new ArtistNotFoundException(where.slug);
		}
		Logger.warn(`Artist '${deletedArtist.slug}' deleted`);
		try {
			const artistIllustrationFolder = this.illustrationService.buildArtistIllustrationFolderPath(
				new Slug(deletedArtist.slug)
			);
			this.illustrationService.deleteIllustrationFolder(artistIllustrationFolder);
		} catch {}
	}

	/**
	 * Deletes an artist if it does not have any album or song
	 * @param where the query parameters to find the artist to delete
	 */
	async deleteArtistIfEmpty(where: ArtistQueryParameters.WhereInput): Promise<void> {
		const albumCount = await this.albumService.countAlbums({ byArtist: where });
		const songCount = await this.songService.countSongs({ artist: where });
		if (songCount == 0 && albumCount == 0)
			await this.deleteArtist(where);
	}

	/**
	 * Find an artist by its name, or creates one if not found
	 * @param where the query parameters to find / create the artist
	 */
	async getOrCreateArtist(
		where: ArtistQueryParameters.GetOrCreateInput,
		include?: ArtistQueryParameters.RelationInclude
	) {
		try {
			return await this.getArtist({ slug: new Slug(where.name) }, include);
		} catch {
			return this.createArtist(where, include);
		}
	}
	
	/**
	 * Build API reponse for Artist Request
	 * @param artist the Artist to build the response from
	 * @returns the response Object
	 */
	buildArtistResponse(artist: Artist & Partial<{ songs: Song[], albums: Album[] }>): Object {
		let response: Object = {
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
					(song) => this.songService.buildSongResponse(song)
				)
			}
		if (artist.albums != undefined)
			response = {
				...response,
				albums: artist.albums.map(
					(album) => this.albumService.buildAlbumResponse(album)
				)
			}
		return response;
	}
}
