import { Controller, Inject, forwardRef, Get, Query, Req, Param } from "@nestjs/common";
import type { Request } from 'express';
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import ParseBaseIdentifierPipe from "src/identifier/identifier.base-pipe";
import PaginatedResponse from "src/pagination/models/paginated-response";
import type { PaginationParameters } from "src/pagination/models/pagination-parameters";
import ParsePaginationParameterPipe from "src/pagination/pagination.pipe";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import GenreService from "./genre.service";
import GenreQueryParameters from "./models/genre.query-parameters";

@ApiTags("Genres")
@Controller('genres')
export class GenreController {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		private genreService: GenreService
	) {}

	@ApiOperation({
		summary: 'Get all genres'
	})
	@Get()
	async getMany(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', GenreQueryParameters.ParseRelationIncludePipe)
		include: GenreQueryParameters.RelationInclude,
		@Query(GenreQueryParameters.ParseSortingParameterPipe)
		sortingParameter: GenreQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const genres = await this.genreService.getMany(
			{}, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			await Promise.all(genres.map((genre) => this.genreService.buildResponse(genre))),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a genre'
	})
	@Get(':idOrSlug')
	async get(
		@Query('with', GenreQueryParameters.ParseRelationIncludePipe)
		include: GenreQueryParameters.RelationInclude,
		@Param(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput
	) {
		const genre = await this.genreService.get(where, include);
		return await this.genreService.buildResponse(genre);
	}

	@ApiOperation({
		summary: 'Get all songs with at least one song from the genre'
	})
	@Get(':idOrSlug/songs')
	async getGenreSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Param(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const songs = await this.songService.getMany(
			{ genre: where }, paginationParameters, include, sortingParameter
		);
		if (songs.length == 0)
			await this.genreService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(songs.map(
				(song) => this.songService.buildResponse(song)
			)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums with at least one song from the genre'
	})
	@Get(':idOrSlug/albums')
	async getGenreAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{ byGenre: where }, paginationParameters, include, sortingParameter
		);
		if (albums.length == 0)
			await this.genreService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(albums.map(
				(album) => this.albumService.buildResponse(album)
			)),
			request
		)
	}

	@ApiOperation({
		summary: 'Get all artists with at least one song from the genre'
	})
	@Get(':idOrSlug/artists')
	async getGenreArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Param(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput,
		@Query(ArtistQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const artists = await this.artistService.getMany(
			{ byGenre: where }, paginationParameters , include, sortingParameter
		);
		if (artists.length == 0)
			await this.genreService.throwIfNotExist(where);
		return new PaginatedResponse(
			await Promise.all(artists.map(
				(artist) => this.artistService.buildResponse(artist)
			)),
			request
		);
	}
}