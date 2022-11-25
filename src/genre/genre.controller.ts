import {
	Controller, Get, Inject, Query, Req, forwardRef
} from "@nestjs/common";
import type { Request } from 'express';
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import ParseBaseIdentifierPipe from "src/identifier/identifier.base-pipe";
import PaginatedResponse from "src/pagination/models/paginated-response";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import GenreService from "./genre.service";
import GenreQueryParameters from "./models/genre.query-parameters";
import { GenreResponse } from "./models/genre.response";
import { ApiPaginatedResponse } from "src/pagination/paginated-response.decorator";
import { SongResponse } from "src/song/models/song.response";
import { AlbumResponse } from "src/album/models/album.response";
import { ArtistResponse } from "src/artist/models/artist.response";
import { PaginationQuery } from "src/pagination/pagination-query.decorator";
import { IdentifierParam } from "src/identifier/identifier-param.decorator";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import SortingQuery from "src/sort/sort-query.decorator";

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
	@ApiPaginatedResponse(GenreResponse)
	async getMany(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
		@SortingQuery(GenreQueryParameters.SortingKeys)
		sortingParameter: GenreQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const genres = await this.genreService.getMany(
			{}, paginationParameters, include, sortingParameter
		);

		return PaginatedResponse.awaiting(
			genres.map((genre) => this.genreService.buildResponse(genre)),
			request
		);
	}

	@ApiOperation({
		summary: 'Get a genre'
	})
	@Get(':idOrSlug')
	async get(
		@RelationIncludeQuery(GenreQueryParameters.AvailableAtomicIncludes)
		include: GenreQueryParameters.RelationInclude,
		@IdentifierParam(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput
	) {
		const genre = await this.genreService.get(where, include);

		return this.genreService.buildResponse(genre);
	}

	@ApiOperation({
		summary: 'Get all songs with at least one song from the genre'
	})
	@ApiPaginatedResponse(SongResponse)
	@Get(':idOrSlug/songs')
	async getGenreSongs(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(SongQueryParameters.AvailableAtomicIncludes)
		include: SongQueryParameters.RelationInclude,
		@IdentifierParam(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput,
		@SortingQuery(SongQueryParameters.SortingKeys)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const songs = await this.songService.getMany(
			{ genre: where }, paginationParameters, include, sortingParameter
		);

		if (songs.length == 0) {
			await this.genreService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			songs.map(
				(song) => this.songService.buildResponse(song)
			),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all albums with at least one song from the genre'
	})
	@ApiPaginatedResponse(AlbumResponse)
	@Get(':idOrSlug/albums')
	async getGenreAlbums(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(AlbumQueryParameters.AvailableAtomicIncludes)
		include: AlbumQueryParameters.RelationInclude,
		@IdentifierParam(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput,
		@SortingQuery(AlbumQueryParameters.SortingKeys)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query() filter: AlbumQueryParameters.AlbumFilterParameter,
		@Req() request: Request
	) {
		const albums = await this.albumService.getMany(
			{ byGenre: where, byType: filter.type }, paginationParameters, include, sortingParameter
		);

		if (albums.length == 0) {
			await this.genreService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			albums.map(
				(album) => this.albumService.buildResponse(album)
			),
			request
		);
	}

	@ApiOperation({
		summary: 'Get all artists with at least one song from the genre'
	})
	@ApiPaginatedResponse(ArtistResponse)
	@Get(':idOrSlug/artists')
	async getGenreArtists(
		@PaginationQuery()
		paginationParameters: PaginationParameters,
		@RelationIncludeQuery(ArtistQueryParameters.AvailableAtomicIncludes)
		include: ArtistQueryParameters.RelationInclude,
		@IdentifierParam(ParseBaseIdentifierPipe)
		where: GenreQueryParameters.WhereInput,
		@SortingQuery(ArtistQueryParameters.SortingKeys)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Req() request: Request
	) {
		const artists = await this.artistService.getMany(
			{ byGenre: where }, paginationParameters, include, sortingParameter
		);

		if (artists.length == 0) {
			await this.genreService.throwIfNotFound(where);
		}
		return PaginatedResponse.awaiting(
			artists.map(
				(artist) => this.artistService.buildResponse(artist)
			),
			request
		);
	}
}
