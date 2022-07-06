import { Controller, Get, Param, Query } from '@nestjs/common';
import type { Album, Artist } from '@prisma/client';
import { UrlGeneratorService } from 'nestjs-url-generator';
import IllustrationController from 'src/illustration/illustration.controller';
import type { PaginationParameters } from 'src/pagination/parameters';
import ParsePaginationParameterPipe from 'src/pagination/pipe';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import AlbumService from './album.service';

@Controller('albums')
export default class AlbumController {
	constructor(
		private albumService: AlbumService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	@Get()
	async getAlbums(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters
	) {
		let albums = await this.albumService.getAlbums({}, paginationParameters, { artist: true })
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:artist')
	async getAlbumsByArtist(
		@Query(ParsePaginationParameterPipe) paginationParameters: PaginationParameters,
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined
	) {
		let albums = await this.albumService.getAlbums({
			byArtist: artistSlug ? { slug: artistSlug } : null
		}, paginationParameters);
		return albums.map(
			(album) => this.buildAlbumResponse(album)
		);
	}

	@Get('/:artist/:album')
	async getAlbum(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug
	) {
		let album = await this.albumService.getAlbum({
			bySlug: {
				slug: albumSlug,
				artist: artistSlug ? { slug: artistSlug } : undefined
			}
		});
		return this.buildAlbumResponse(album);
	}

	private buildAlbumResponse(album: Album & { artist: Artist | null }) {
		return {
			...album,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: IllustrationController,
				controllerMethod: IllustrationController.prototype.getMasterIllustration,
				params: {
					artist: album.artist
						? album.artist.slug
						: compilationAlbumArtistKeyword,
					album: album.slug
				}
			})
		};
	}
}