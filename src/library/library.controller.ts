import { Body, Controller, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import LibraryService from './library.service';
import { LibraryDto } from './models/library.dto';
import type { Artist, Library, Release, Song, Track } from '@prisma/client';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import LibraryQueryParameters from './models/library.query-parameters';
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
		@Query('with', LibraryQueryParameters.ParseRelationIncludePipe)
		include: LibraryQueryParameters.RelationInclude
	) {
		return await this.libraryService.getLibraries({}, paginationParameters, include);
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
		@Query('with', LibraryQueryParameters.ParseRelationIncludePipe)
		include: LibraryQueryParameters.RelationInclude
	): Promise<Library> {
		return await this.libraryService.getLibrary({ id: libraryId }, include);
	}
	
	@Get('/:id/artists')
	async getArtistsByLibrary(
		@Param('slug', ParseSlugPipe)
		slug: Slug,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ArtistQueryParameters.AvailableIncludes))
		include: ArtistQueryParameters.RelationInclude
	): Promise<Artist[]> {
		return await this.artistService.getArtists({ byLibrarySource: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:id/albums')
	async getAlbumsByLibrary(
		@Param('slug', ParseSlugPipe)
		slug: Slug,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(AlbumQueryParameters.AvailableIncludes))
		include: AlbumQueryParameters.RelationInclude
	): Promise<Artist[]> {
		return await this.albumService.getAlbums({ byLibrarySource: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:id/releases')
	async getReleasesByLibrary(
		@Param('slug', ParseSlugPipe)
		slug: Slug,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(ReleaseQueryParameters.AvailableIncludes))
		include: ReleaseQueryParameters.RelationInclude
	): Promise<Release[]> {
		return await this.releaseService.getReleases({ library: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:id/songs')
	async getSongsByLibrary(
		@Param('slug', ParseSlugPipe)
		slug: Slug,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(SongQueryParameters.AvailableIncludes))
		include: SongQueryParameters.RelationInclude
	): Promise<Song[]> {
		return await this.songService.getSongs({ library: {
			slug: slug
		} }, paginationParameters, include);
	}

	@Get('/:id/tracks')
	async getTracksByLibrary(
		@Param('slug', ParseSlugPipe)
		slug: Slug,
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', new ParseRelationIncludePipe(TrackQueryParameters.AvailableIncludes))
		include: TrackQueryParameters.RelationInclude
	): Promise<Track[]> {
		return await this.trackService.getTracks({ byLibrarySource: {
			slug: slug
		} }, paginationParameters, include);
	}
}
