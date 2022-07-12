import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';

import LibraryService from './library.service';
import { LibraryDto } from './models/library.dto';
import type { Library } from '@prisma/client';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParseRelationIncludePipe from 'src/relation-include/relation-include.pipe';
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

	@Post('new')
	async createLibrary(@Body() createLibraryDto: LibraryDto) {
		return await this.libraryService.createLibrary(createLibraryDto);
	}
	@Get()
	async getLibraries(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
	) {
		return await this.libraryService.getLibraries({}, paginationParameters);
	}
		
	@Get('scan')
	async scanLibrariesFiles() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error))
		);
		return `Scanning ${libraries.length} libraries`
	}

	@Get('clean')
	async cleanLibraries() {
		const libraries = await this.libraryService.getLibraries({});
		libraries.forEach((library) => this.libraryService
			.unregisterUnavailableFiles(library.id)
			.catch((error) => Logger.error(error))
		);
		return `Cleanning ${libraries.length} libraries`;
	}

	@Get('scan/:id')
	async scanLibraryFiles(@Param('id', ParseIntPipe) libraryId: number) {
		let library = await this.libraryService.getLibrary({ id: libraryId });
		this.libraryService
			.registerNewFiles(library)
			.catch((error) => Logger.error(error));
	}

	@Get('clean/:id')
	async cleanLibrary(@Param('id', ParseIntPipe) libraryId: number) {
		this.libraryService
			.unregisterUnavailableFiles(libraryId)
			.catch((error) => Logger.error(error));
	}

	@Get(':id')
	async getLibrary(
		@Param('id', ParseIntPipe) libraryId: number,
	): Promise<Library> {
		return await this.libraryService.getLibrary({ id: libraryId });
	}
	
	@Get(':id/artists')
	async getArtistsByLibrary(
		@Param('id', ParseIntPipe)
		libraryId: number,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ArtistQueryParameters.AvailableIncludes))
		include: ArtistQueryParameters.RelationInclude
	): Promise<Object[]> {
		const artists = await this.artistService.getArtists({ byLibrarySource: {
			id: libraryId
		} }, paginationParameters, include);
		if (artists.length == 0)
			await this.libraryService.getLibrary({ id: libraryId });
		return artists.map((artist) => this.artistService.buildArtistResponse(artist));
	}

	@Get(':id/albums')
	async getAlbumsByLibrary(
		@Param('id', ParseIntPipe)
		libraryId: number,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(AlbumQueryParameters.AvailableIncludes))
		include: AlbumQueryParameters.RelationInclude
	): Promise<Object[]> {
		const albums = await this.albumService.getAlbums({ byLibrarySource: {
			id: libraryId
		} }, paginationParameters, include);
		if (albums.length == 0)
			await this.libraryService.getLibrary({ id: libraryId });
		return albums.map((album) => this.albumService.buildAlbumResponse(album));
	}

	@Get(':id/releases')
	async getReleasesByLibrary(
		@Param('id', ParseIntPipe)
		libraryId: number,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ReleaseQueryParameters.AvailableIncludes))
		include: ReleaseQueryParameters.RelationInclude
	): Promise<Object[]> {
		const releases = await this.releaseService.getReleases({ library: {
			id: libraryId
		} }, paginationParameters, include);
		if (releases.length == 0)
			await this.libraryService.getLibrary({ id: libraryId });
		return releases.map((release) => this.releaseService.buildReleaseResponse(release));
	}

	@Get(':id/songs')
	async getSongsByLibrary(
		@Param('id', ParseIntPipe)
		libraryId: number,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(SongQueryParameters.AvailableIncludes))
		include: SongQueryParameters.RelationInclude
	): Promise<Object[]> {
		const songs =  await this.songService.getSongs({ library: {
			id: libraryId
		} }, paginationParameters, include);
		if (songs.length == 0)
			await this.libraryService.getLibrary({ id: libraryId });
		return songs.map((song) => this.songService.buildSongResponse(song));
	}

	@Get(':id/tracks')
	async getTracksByLibrary(
		@Param('id', ParseIntPipe)
		libraryId: number,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(TrackQueryParameters.AvailableIncludes))
		include: TrackQueryParameters.RelationInclude
	): Promise<Object[]> {
		const tracks = await this.trackService.getTracks({ byLibrarySource: {
			id: libraryId
		} }, paginationParameters, include);
		if (tracks.length == 0)
			await this.libraryService.getLibrary({ id: libraryId });
		return tracks.map((track) => this.trackService.buildTrackResponse(track));
	}
}
