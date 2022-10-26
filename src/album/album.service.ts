import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import ArtistService from 'src/artist/artist.service';
import Slug from 'src/slug/slug';
import { AlbumAlreadyExistsException, AlbumAlreadyExistsExceptionWithArtistID as AlbumAlreadyExistsWithArtistIDException, AlbumNotFoundException, AlbumNotFoundFromIDException } from './album.exceptions';
import { AlbumType,  Prisma } from '@prisma/client';
import PrismaService from 'src/prisma/prisma.service';
import AlbumQueryParameters from './models/album.query-parameters';
import type ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import ReleaseService from 'src/release/release.service';
import IllustrationService from 'src/illustration/illustration.service';
import RepositoryService from 'src/repository/repository.service';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import GenreService from "../genre/genre.service";
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import SongService from 'src/song/song.service';
import { Album, Release, Genre, AlbumWithRelations } from "src/prisma/models";
import { AlbumResponse } from './models/album.response';
import SortingParameter from 'src/sort/models/sorting-parameter';

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
	Prisma.AlbumOrderByWithRelationInput
> {
	constructor(
		prismaService: PrismaService,
		@Inject(forwardRef(() => ArtistService))
		private artistServce: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		private genreService: GenreService
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
			if (await this.count({ byName: { is: album.name }, byArtist: { compilationArtist: true } }) != 0)
				throw new AlbumAlreadyExistsException(new Slug(album.name));
		}
		return await super.create(album, include);
	}

	formatCreateInput(input: AlbumQueryParameters.CreateInput) {
		return {
			name: input.name,
			artist: input.artist ? {
				connect: ArtistService.formatWhereInput(input.artist)
			} : undefined,
			slug: new Slug(input.name).toString(),
			releaseDate: input.releaseDate,
			type: AlbumService.getAlbumTypeFromName(input.name)
		};
	}
	protected formatCreateInputToWhereInput(where: AlbumQueryParameters.CreateInput) {
		return {
			bySlug: { slug: new Slug(where.name), artist: where.artist },
		}
	}
	protected async onCreationFailure(input: AlbumQueryParameters.CreateInput) {
		const albumSlug = new Slug(input.name);
		if (input.artist)
			await this.artistServce.get(input.artist);
		if (input.artist?.id)
			return new AlbumAlreadyExistsWithArtistIDException(albumSlug, input.artist.id);
		return new AlbumAlreadyExistsException(albumSlug, input.artist?.slug);
	}

	/**
	 * Find an album
	 */
	static formatWhereInput(where: AlbumQueryParameters.WhereInput) {
		return {
			id: where.byId?.id,
			slug: where.bySlug?.slug.toString(),
			artist: where.bySlug ?
				where.bySlug.artist
					? ArtistService.formatWhereInput(where.bySlug.artist)
					: null
			: undefined
		}
	}
	formatWhereInput = AlbumService.formatWhereInput;

	static formatManyWhereInput(where: AlbumQueryParameters.ManyWhereInput) {
		return {
			type: where.byType,
			artist: where.byArtist
				? where.byArtist.compilationArtist
					? null
					: ArtistService.formatWhereInput(where.byArtist)	
			: where.byArtist,
			name: buildStringSearchParameters(where.byName),
			releases: where.byLibrarySource || where.byGenre ? {
				some: where.byLibrarySource
					? ReleaseService.formatManyWhereInput({ library: where.byLibrarySource })
					: where.byGenre
						? {
							tracks: {
								some: {
									song: SongService.formatManyWhereInput({ genre: where.byGenre })
								}
							}
						}
						: undefined
			} : undefined
		};
	}
	formatManyWhereInput = AlbumService.formatManyWhereInput;

	formatSortingInput(
		sortingParameter: SortingParameter<AlbumQueryParameters.SortingKeys>
	): Prisma.AlbumOrderByWithRelationInput {
		switch (sortingParameter.sortBy) {
			case 'name':
				return { slug: sortingParameter.order }
			case 'artistName':
				return { artist: this.artistServce.formatSortingInput(
					{ sortBy: 'name', order :sortingParameter.order })
				}
			case 'addDate':
				return { id: sortingParameter.order }
			case 'releaseDate':
				return { releaseDate: {sort: sortingParameter.order, nulls: 'last'}}
			default:
				return {[sortingParameter.sortBy ?? 'id']: sortingParameter.order}
		}
	}
	
	/**
	 * Updates an album
	 */
	formatUpdateInput(what: AlbumQueryParameters.UpdateInput) {
		return {
			...what,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		}
	}
	/**
	 * Updates an album date, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	async updateAlbumDate(where: AlbumQueryParameters.WhereInput) {
		const album = await this.get(where, { releases: true });
		for (const release of album.releases) {
			if (album.releaseDate == null ||
				(release.releaseDate && release.releaseDate < album.releaseDate)) {
				album.releaseDate = release.releaseDate;
			}
		}
		return await this.update({ releaseDate: album.releaseDate }, { byId: { id: album.id }});
	}

	/**
	 * Updates an album master, using the earliest date from its releases
	 * @param where the query parameter to get the album to update
	 */
	 async updateAlbumMaster(where: AlbumQueryParameters.WhereInput): Promise<Release | null> {
		const releases = await this.releaseService.getAlbumReleases(where);
		const sortedReleases = releases
			.filter((releases) => releases.releaseDate !== null)
			.sort((releaseA, releaseB) => releaseA.releaseDate!.getTime() - releaseB.releaseDate!.getTime())
		if (sortedReleases.length !== 0) {
			const newMaster = sortedReleases.at(0)!
			await this.releaseService.setReleaseAsMaster({ releaseId: newMaster.id, album: where });
			return { ...newMaster, master: true };
		} else if (releases.length !== 0) {
			await this.releaseService.setReleaseAsMaster({ releaseId: releases[0].id, album: where });
			return { ...releases[0], master: true };
		}
		return null;
	}

	/**
	 * Deletes an album
	 * @param where the query parameter 
	 */
	async delete(where: AlbumQueryParameters.DeleteInput): Promise<Album> {
		const album = await this.get(where, { releases: true, artist: true });
		await Promise.all(
			album.releases.map(
				(release) => this.releaseService.delete({ byId: { id: release.id }}, false)
			)
		);
		try {
			await super.delete(where);
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
	formatDeleteInput(where: AlbumQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}
	protected formatDeleteInputToWhereInput(input: AlbumQueryParameters.DeleteInput) {
		return input;
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
	 * Get an album's genres, based on the songs on its releases
	 * Genres will be ordered by occurences
	 */
	async getGenres(
		where: AlbumQueryParameters.WhereInput
	) : Promise<Genre[]> {
		const releases = await this.releaseService.getAlbumReleases(where, {}, { tracks: true });
		const songsId = Array.from(new Set(releases.map((release) => release.tracks.map((track) => track.songId)).flat()));
		const genres: Genre[] = (await Promise.all(
			songsId.map((songId) => this.genreService.getSongGenres({ byId: { id: songId } }))
		)).flat();
		const genresOccurrences = genres.reduce(
			(occurences, genre) => occurences.set(genre.slug, (occurences.get(genre.slug) || 0) + 1),
			new Map<string, number>()
		);
		return Array.from(genresOccurrences.entries()).sort(
			(genreA, genreB) => genreB[1] - genreA[1]
		).map((genresSlugOccurrence) => genres.find((genre) => genresSlugOccurrence[0] == genre.slug)!);
	}

	/**
	 * Build an object for the API 
	 * @param album the album to create the object from
	 */
	async buildResponse(album: AlbumWithRelations): Promise<AlbumResponse> {
		const response = <AlbumResponse>{
			...album,
			illustration: await this.illustrationService.getAlbumIllustrationLink(album.id)
		};
		if (album.artist != undefined)
			response.artist = await this.artistServce.buildResponse(album.artist)
		return response;
	}

	onNotFound(where: AlbumQueryParameters.WhereInput): MeeloException {
		if (where.byId)
			return new AlbumNotFoundFromIDException(where.byId.id);
		return new AlbumNotFoundException(where.bySlug.slug, where.bySlug.artist?.slug);
	}

	static getAlbumTypeFromName(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.includes('soundtrack') ||
			albumName.includes('from the motion picture') ||
			albumName.includes('bande originale')) {
			return AlbumType.Soundtrack
		}
		if (albumName.includes('music videos') ||
			albumName.includes('the video') ||
			albumName.includes('dvd') ) {
			return AlbumType.VideoAlbum;
		}
		if (albumName.search(/.+(live).*/g) != -1 ||
			albumName.includes(' tour') ||
			albumName.includes('live from ') ||
			albumName.includes('live at ')) {
			return AlbumType.LiveRecording
		}
		if (albumName.endsWith('- single') ||
			albumName.endsWith('- ep') ||
			albumName.endsWith('(remixes)')) {
			return AlbumType.Single
		}
		if (
			albumName.includes('remix album') ||
			albumName.includes(' the remixes') ||
			albumName.includes('mixes') ||
			albumName.includes('remixes') ||
			albumName.includes('best mixes')) {
			return AlbumType.RemixAlbum
		}
		if (albumName.includes('best of') ||
			albumName.includes('greatest hits') ||
			albumName.includes('singles') ||
			albumName.includes('collection')) {
			return AlbumType.Compilation
		}
		return AlbumType.StudioRecording;
	}
}
