import { Body, Controller, Delete, Get, Logger, Param, Post, Query, Req } from '@nestjs/common';
import LibraryService from './library.service';
import LibraryDto from './models/create-library.dto';
import type { Library } from '@prisma/client';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ArtistService from 'src/artist/artist.service';
import ArtistQueryParameters from 'src/artist/models/artist.query-parameters';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import SongQueryParameters from 'src/song/models/song.query-params';
import TrackQueryParameters from 'src/track/models/track.query-parameters';
import TrackService from 'src/track/track.service';
import ReleaseService from 'src/release/release.service';
import SongService from 'src/song/song.service';
import LibraryQueryParameters from './models/library.query-parameters';
import ParseLibraryIdentifierPipe from './library.pipe';
import type { Request } from 'express';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags("Libraries")
@Controller('libraries')
export default class LibraryController {
	constructor(
		private libraryService: LibraryService,
		private artistService: ArtistService,
		private albumService: AlbumService,
		private trackService: TrackService,
		private songService: SongService,
		private releaseService: ReleaseService,
	) { }

	@ApiOperation({
		summary: 'Create a new library'
	})
	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return this.libraryService.create(createLibraryDto);
	}

	@ApiOperation({
		summary: 'Get all libraries'
	})
	@Get()
	async getLibraries(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query(LibraryQueryParameters.ParseSortingParameterPipe)
		sortingParameter: LibraryQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		return new PaginatedResponse(
			await this.libraryService.getMany({}, paginationParameters, {}, sortingParameter),
			request
		);
	}
	
	@ApiOperation({
		summary: 'Scan all libraries'
	})
	@Get('scan')
	async scanLibrariesFiles() {
		const libraries = await this.libraryService.getMany({});
		libraries.forEach((library) => this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error))
		);
		return `Scanning ${libraries.length} libraries`
	}

	@ApiOperation({
		summary: 'Clean all libraries'
	})
	@Get('clean')
	async cleanLibraries() {
		const libraries = await this.libraryService.getMany({});
		libraries.forEach((library) => this.libraryService
			.unregisterUnavailableFiles({ id: library.id })
			.catch((error) => Logger.error(error))
		);
		return `Cleanning ${libraries.length} libraries`;
	}

	@ApiOperation({
		summary: 'Scan a library'
	})
	@Get('scan/:idOrSlug')
	async scanLibraryFiles(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput
	) {
		let library = await this.libraryService.get(where);
		this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
	}

	@ApiOperation({
		summary: 'Clean a library'
	})
	@Get('clean/:idOrSlug')
	async cleanLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput
	) {
		this.libraryService
			.unregisterUnavailableFiles(where)
			.catch((error) => Logger.error(error));
	}

	@ApiOperation({
		summary: 'Get a library'
	})
	@Get(':idOrSlug')
	async getLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
	): Promise<Library> {
		return this.libraryService.get(where);
	}

	@ApiOperation({
		summary: 'Delete a library'
	})
	@Delete(':idOrSlug')
	async deleteLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
	): Promise<void> {
		this.libraryService.delete(where);
	}

	@ApiOperation({
		summary: 'Get all album artists from a library'
	})
	@Get(':idOrSlug/artists')
	async getArtistsByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Query(ArtistQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const artists = await this.artistService.getAlbumsArtists(
			{ byLibrarySource: where }, paginationParameters, include, sortingParameter
		);
		if (artists.length == 0)
			await this.libraryService.get(where);
		return new PaginatedResponse(
			artists.map((artist) => this.artistService.buildResponse(artist)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums from a library'
	})
	@Get(':idOrSlug/albums')
	async getAlbumsByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const albums = await this.albumService.getMany(
			{ byLibrarySource: where }, paginationParameters, include, sortingParameter
		);
		if (albums.length == 0)
			await this.libraryService.get(where);
		return new PaginatedResponse(
			albums.map((album) => this.albumService.buildResponse(album)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all releases from a library'
	})
	@Get(':idOrSlug/releases')
	async getReleasesByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ReleaseQueryParameters.ParseRelationIncludePipe)
		include: ReleaseQueryParameters.RelationInclude,
		@Query(ReleaseQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ReleaseQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const releases = await this.releaseService.getMany(
			{ library: where }, paginationParameters, include, sortingParameter
		);
		if (releases.length == 0)
			await this.libraryService.get(where);
		return new PaginatedResponse(
			releases.map((release) => this.releaseService.buildResponse(release)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all songs from a library'
	})
	@Get(':idOrSlug/songs')
	async getSongsByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const songs =  await this.songService.getSongs(
			{ library: where }, paginationParameters, include, sortingParameter
		);
		if (songs.length == 0)
			await this.libraryService.get(where);
		return new PaginatedResponse(
			songs.map((song) => this.songService.buildSongResponse(song)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all tracks from a library'
	})
	@Get(':idOrSlug/tracks')
	async getTracksByLibrary(
		@Param(ParseLibraryIdentifierPipe)
		where: LibraryQueryParameters.WhereInput,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with',TrackQueryParameters.ParseRelationIncludePipe)
		include: TrackQueryParameters.RelationInclude,
		@Query(TrackQueryParameters.ParseSortingParameterPipe)
		sortingParameter: TrackQueryParameters.SortingParameter,
		@Req() request: Request
	): Promise<PaginatedResponse<Object>> {
		const tracks = await this.trackService.getTracks(
			{ byLibrarySource: where }, paginationParameters, include, sortingParameter
		);
		if (tracks.length == 0)
			await this.libraryService.get(where);
		return new PaginatedResponse(
			tracks.map((track) => this.trackService.buildTrackResponse(track)),
			request
		);
	}
}
