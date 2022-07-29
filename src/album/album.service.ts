import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumAlreadyExistsExceptionWithArtistID as AlbumAlreadyExistsWithArtistIDException, AlbumNotFoundException, AlbumNotFoundFromIDException } from './album.exceptions';
import { AlbumType, Album, Release, Artist } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import AlbumQueryParameters from './models/album.query-parameters';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import { UrlGeneratorService } from 'nestjs-url-generator';
import AlbumController from './album.controller';
import ReleaseService from 'src/release/release.service';
import IllustrationService from 'src/illustration/illustration.service';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';

@Injectable()
export default class AlbumService extends RepositoryService<
	Album,
	AlbumQueryParameters.CreateInput,
	AlbumQueryParameters.WhereInput,
	AlbumQueryParameters.ManyWhereInput,
	AlbumQueryParameters.UpdateInput,
	AlbumQueryParameters.DeleteInput,
	AlbumQueryParameters.RelationInclude,
	AlbumQueryParameters.SortingParameter,
	Album & { illustration: string }
> {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistServce: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {
		super();
	}


	/**
	 * Create an Album, and saves it in the database
	 * @param album the album object to save
	 * @param include the relation to include in the returned value
	 * @returns the saved Album
	 */
	async create(
		album: AlbumQueryParameters.CreateInput,
		include?: AlbumQueryParameters.RelationInclude
	) {
		const albumSlug = new Slug(album.name);
		if (album.artist === undefined) {
			if (await this.count({ byName: { is: album.name }, byArtist: { compilationArtist: true } }) != 0)
				throw new AlbumAlreadyExistsException(albumSlug);
		}
		try {
			return await this.prismaService.album.create({
				data: {
					name: album.name,
					artist: album.artist ? {
						connect: ArtistQueryParameters.buildQueryParametersForOne(album.artist)
					} : undefined,
					slug: albumSlug.toString(),
					releaseDate: album.releaseDate,
					type: AlbumService.getAlbumTypeFromName(album.name)
				},
				include: AlbumQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			if (album.artist)
				await this.artistServce.get(album.artist);
			if (album.artist?.id)
				throw new AlbumAlreadyExistsWithArtistIDException(albumSlug, album.artist.id);
			throw new AlbumAlreadyExistsException(albumSlug, album.artist?.slug);
		}
	}

	/**
	 * Find an album
	 * @param where the parameters to find the album
	 * @param include the relations to include
	 */
	async get(
		where: AlbumQueryParameters.WhereInput,
		include?: AlbumQueryParameters.RelationInclude
	) {
		try {
			return await this.prismaService.album.findFirst({
				rejectOnNotFound: true,
				where: AlbumQueryParameters.buildQueryParametersForOne(where),
				include: AlbumQueryParameters.buildIncludeParameters(include),
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Find multiple albums
	 * @param where the parameters to find the album
	 * @param pagination the pagination paramters to filter entries
	 * @param include the relations to include
	 */
	async getMany(
		where: AlbumQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: AlbumQueryParameters.RelationInclude,
		sort?: AlbumQueryParameters.SortingParameter
	) {
		return await this.prismaService.album.findMany({
			where: AlbumQueryParameters.buildQueryParametersForMany(where),
			include: AlbumQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Count the albums that match the query parameters
	 * @param where the query parameters
	 */
	async count(where: AlbumQueryParameters.ManyWhereInput): Promise<number> {
		return await this.prismaService.album.count({
			where: AlbumQueryParameters.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Updates an album in the database
	 * @param what the fields to update
	 * @param where the query parameters to find the album to update
	 * @returns the updated album
	 */
	async update(
		what: AlbumQueryParameters.UpdateInput,
		where: AlbumQueryParameters.WhereInput
	): Promise<Album> {
		try {
			return await this.prismaService.album.update({
				data: {
					...what,
					slug: what.name ? new Slug(what.name).toString() : undefined,
				},
				where: AlbumQueryParameters.buildQueryParametersForOne(where)
			});
		} catch {
			throw this.onNotFound(where);
		}
	}

	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	async updateAlbumDate(where: AlbumQueryParameters.WhereInput) {
		let album = await this.get(where, { releases: true });
		for (const release of album.releases) {
			if (album.releaseDate == null ||
				(release.releaseDate && release.releaseDate < album.releaseDate)) {
				album.releaseDate = release.releaseDate;
			}
		}
		return await this.update({ releaseDate: album.releaseDate }, { byId: { id: album.id }});
	}

	/**
	 * Deletes an album
	 * @param where the query parameter 
	 */
	async delete(where: AlbumQueryParameters.DeleteInput): Promise<Album> {
		let album = await this.get(where, { releases: true, artist: true });
		await Promise.all(
			album.releases.map(
				(release) => this.releaseService.delete({ byId: { id: release.id }}, false)
			)
		);
		try {
			await this.prismaService.album.delete({
				where: AlbumQueryParameters.buildQueryParametersForOne(where),
			});
		} catch {
			return album;
		}
		Logger.warn(`Album '${album.slug}' deleted`);
		if (album.artistId !== null)
			await this.artistServce.deleteArtistIfEmpty({ id: album.artistId });
		try {
			const albumIllustrationFolder = this.illustrationService.buildAlbumIllustrationFolderPath(
				new Slug(album.slug), album.artist ? new Slug(album.artist.slug) : undefined
			);
			this.illustrationService.deleteIllustrationFolder(albumIllustrationFolder);
		} catch {}
		return album;
	}

	/**
	 * Delete an album if it does not have related releases
	 * @param albumId 
	 */
	async deleteIfEmpty(albumId: number): Promise<void> {
		const albumCount = await this.releaseService.count({
			album: { byId: { id: albumId } }
		});
		if (albumCount == 0)
			await this.delete({ byId: { id: albumId } });
	}

	/**
	 * Get an album, or create it if it does not exist
	 * @param where the query parameters to find / create he album
	 * @param include the relation fields to include in the returned album
	 * @returns 
	 */
	async getOrCreate(where: AlbumQueryParameters.GetOrCreateInput, include?: AlbumQueryParameters.RelationInclude) {
		try {
			return await this.get({
				bySlug: { slug: new Slug(where.name), artist: where.artist },
			}, include);
		} catch {
			return await this.create({...where}, include);
		}
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
			: await this.getMany({ byArtist: { compilationArtist: true } });
		
		if (artistAlbums.find((artistAlbum) => album.slug == artistAlbum.slug))
			throw new AlbumAlreadyExistsException(albumSlug, newArtistSlug)
		const updatedAlbum = await this.update({ artistId: newArtist?.id ?? null }, albumWhere);
		this.illustrationService.reassignAlbumIllustrationFolder(albumSlug, previousArtistSlug, newArtistSlug);
		if (album.artistId)
			await this.artistServce.deleteArtistIfEmpty({ id: album.artistId });
		return updatedAlbum;
	}

	/**
	 * Build an object for the API 
	 * @param album the album to create the object from
	 */
	buildResponse<ResponseType extends Album & { illustration: string }>(
		album: Album & Partial<{ releases: Release[], artist: Artist | null }>
	): ResponseType {
		let response = <ResponseType>{
			...album,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: AlbumController,
				controllerMethod: AlbumController.prototype.getAlbumIllustration,
				params: {
					idOrSlug: album.id.toString()
				}
			})
		};
		if (album.releases)
			response = {
				...response,
				releases: album.releases.map(
					(release) => this.releaseService.buildResponse(release)
				)
			};
		if (album.artist != undefined)
			response = {
				...response,
				artist: this.artistServce.buildResponse(album.artist)
			};
		return response;
	}

	onNotFound(where: AlbumQueryParameters.WhereInput): MeeloException {
		if (where.byId)
			return new AlbumNotFoundFromIDException(where.byId.id);
		return new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artist?.slug);
	}

	static getAlbumTypeFromName(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.search(/.+(live).*/g) != -1 ||
			albumName.includes(' tour')) {
			return AlbumType.LiveRecording
		}
		if (albumName.endsWith('- single') ||
			albumName.endsWith('(remixes)')) {
			return AlbumType.Single
		}
		if (albumName.includes('best of') ||
			albumName.includes('best mixes')) {
			return AlbumType.Compilation
		}
		return AlbumType.StudioRecording;
	}
}
