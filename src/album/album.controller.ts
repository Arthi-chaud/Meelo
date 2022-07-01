import { Controller, Get, Param } from '@nestjs/common';
import { ParseArtistSlugPipe, ParseSlugPipe } from 'src/slug/pipe';
import Slug from 'src/slug/slug';
import { AlbumService } from './album.service';

@Controller('albums')
export class AlbumController {
	constructor(
		private albumService: AlbumService,
	) {}

	@Get()
	async getAlbums() {
		let albums = await this.albumService.getAlbums({}, {}, { artist: true })
		return albums.map(
			(album) => ({
				...album,
				// illustration: this.illustrationService.buildAlbumIllustrationFolderPath(
				// 	new Slug(album.slug),
				// 	album.artist ? new Slug(album.artist.slug) : undefined
				// )
			})
		);
	}

	@Get('/compilations/:album')
	async getCompilationAlbum(
		@Param('album', ParseSlugPipe) albumSlug: Slug) {
		let album = await this.albumService.getAlbum({
			bySlug: { slug: albumSlug }
		});
		return album;
	}
	@Get('/:artist')
	async getAlbumsByArtist(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined) {
		let albums = await this.albumService.getAlbums({
			byArtist: artistSlug ? { slug: artistSlug } : undefined
		});
		return albums;
	}

	@Get('/:artist/:album')
	async getAlbum(
		@Param('artist', ParseArtistSlugPipe) artistSlug: Slug | undefined,
		@Param('album', ParseSlugPipe) albumSlug: Slug) {
		let album = await this.albumService.getAlbum({
			bySlug: {
				slug: albumSlug,
				artist: artistSlug ? { slug: artistSlug } : undefined
			}
		});
		return album;
	}
}