import { Body, Controller, DefaultValuePipe, forwardRef, Get, Inject, Param, ParseBoolPipe, Post, Query, Req, Response } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationDownloadDto } from 'src/illustration/models/illustration-dl.dto';
import PaginatedResponse from 'src/pagination/models/paginated-response';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import Slug from 'src/slug/slug';
import SongQueryParameters from 'src/song/models/song.query-params';
import SongService from 'src/song/song.service';
import ParseArtistIdentifierPipe from './artist.pipe';
import ArtistService from './artist.service';
import ArtistQueryParameters from './models/artist.query-parameters';
import type { Request } from 'express';

@Controller('artists')
export default class ArtistController {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		private illustrationService: IllustrationService
	) {}

	@Get()
	async getArtists(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude,
		@Query(ArtistQueryParameters.ParseSortingParameterPipe)
		sortingParameter: ArtistQueryParameters.SortingParameter,
		@Query('albumArtistOnly', new DefaultValuePipe(false), ParseBoolPipe)
		albumArtistsOnly: boolean = false,
		@Req() request: Request
	) {
		let artists = await this.artistService.getArtists(
			{}, paginationParameters, include, sortingParameter
		);
		if (albumArtistsOnly) {
			for (const currentArtist of artists) {
				const albumCount = await this.albumService.countAlbums({
					byArtist: { id: currentArtist.id }
				});
				if (albumCount == 0)
					artists = artists.filter((artist) => artist.id != currentArtist.id);
			}
		}
		return new PaginatedResponse(
			artists.map((artist) => this.artistService.buildArtistResponse(artist)),
			request
		);
	}

	@Get(':idOrSlug')
	async getArtist(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query('with', ArtistQueryParameters.ParseRelationIncludePipe)
		include: ArtistQueryParameters.RelationInclude
	) {
		let artist = await this.artistService.getArtist(where, include);
		return this.artistService.buildArtistResponse(artist);
	}

	@Get(':idOrSlug/illustration')
	async getArtistIllustration(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Response({ passthrough: true })
		res: Response
	) {
		let artist = await this.artistService.getArtist(where);
		return this.illustrationService.streamIllustration(
			this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug)),
			artist.slug, res
		);
	}

	@Post(':idOrSlug/illustration')
	async updateArtistIllustration(
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Body()
		illustrationDto: IllustrationDownloadDto
	) {
		let artist = await this.artistService.getArtist(where);
		const artistIllustrationPath = this.illustrationService.buildArtistIllustrationPath(new Slug(artist.slug));
		return this.illustrationService.downloadIllustration(
			illustrationDto.url,
			artistIllustrationPath
		);
	}

	@Get(':idOrSlug/albums')
	async getArtistAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query(AlbumQueryParameters.ParseSortingParameterPipe)
		sortingParameter: AlbumQueryParameters.SortingParameter,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		let albums = await this.albumService.getAlbums(
			{ byArtist: where }, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			albums.map((album) => this.albumService.buildAlbumResponse(album)),
			request
		);
	}

	@Get(':idOrSlug/songs')
	async getArtistSongs(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Param(ParseArtistIdentifierPipe)
		where: ArtistQueryParameters.WhereInput,
		@Query(SongQueryParameters.ParseSortingParameterPipe)
		sortingParameter: SongQueryParameters.SortingParameter,
		@Query('with', SongQueryParameters.ParseRelationIncludePipe)
		include: SongQueryParameters.RelationInclude,
		@Req() request: Request
	) {
		let songs = await this.songService.getSongs(
			{ artist: where }, paginationParameters, include, sortingParameter
		);
		return new PaginatedResponse(
			songs.map((song) => this.songService.buildSongResponse(song)),
			request
		);
	}

}
