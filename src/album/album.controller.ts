import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Album, Artist } from '@prisma/client';
import { UrlGeneratorService } from 'nestjs-url-generator';
import ArtistService from 'src/artist/artist.service';
import IllustrationController from 'src/illustration/illustration.controller';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import ParsePaginationParameterPipe from 'src/pagination/pagination.pipe';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';
import AlbumQueryParameters from './models/album.query-parameters';


@Controller('albums')
export default class AlbumController {
	constructor(
		private albumService: AlbumService,
		private artistService: ArtistService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	@Get()
	async getAlbums(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude
	) {
		let albums = await this.albumService.getAlbums({}, paginationParameters, include);
		let artists = await this.artistService.getArtists({
			byIds: { in: albums
				.filter((album) => album.artistId != null)
				.map((album) => album.artistId!)
			}
		});
		return albums.map(
			(album) => this.buildAlbumResponse(album, artists.find((artist) => artist.id == album.artistId))
		);
	}

	@Get('/:artist')
	async getAlbumsByArtist(
		@Query(ParsePaginationParameterPipe)
		paginationParameters: PaginationParameters,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param('artist', ParseArtistSlugPipe)
		artistSlug: Slug | undefined
	) {
		let artist = artistSlug ? await this.artistService.getArtist({ slug: artistSlug }) : undefined
		let albums = await this.albumService.getAlbums({
			byArtist: artistSlug ? { slug: artistSlug } : null
		}, paginationParameters, include);
		return albums.map(
			(album) => this.buildAlbumResponse(album, artist)
		);
	}

	@Get('/:artist/:album')
	async getAlbum(
		@Param('artist', ParseArtistSlugPipe)
		artistSlug: Slug | undefined,
		@Query('with', AlbumQueryParameters.ParseRelationIncludePipe)
		include: AlbumQueryParameters.RelationInclude,
		@Param('album', ParseSlugPipe)
		albumSlug: Slug
	) {
		let album = await this.albumService.getAlbum({
			bySlug: {
				slug: albumSlug,
				artist: artistSlug ? { slug: artistSlug } : undefined
			}
		}, include);
		return this.buildAlbumResponse(album);
	}

	private buildAlbumResponse(album: Album, artist?: Artist) {
		return {
			...album,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: IllustrationController,
				controllerMethod: IllustrationController.prototype.getMasterIllustration,
				params: {
					artist: artist
						? artist.slug
						: compilationAlbumArtistKeyword,
					album: album.slug
				}
			})
		};
	}
}