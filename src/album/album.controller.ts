import { Controller, Get, Param } from '@nestjs/common';
import { ParseSlugPipe } from 'src/slug/pipe';
import { Slug } from 'src/slug/slug';
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
		@Param('album', ParseSlugPipe) albumSlug: Slug,) {
		let album = await this.albumService.getAlbum({
			bySlug: { slug: albumSlug }
		});
		return album;
	}

	@Get('/compilations')
	async getCompilationAlbums() {
		let album = await this.albumService.getAlbums({
			byArtist: null
		});
		return album;
	}

	@Get('/:artist')
	async getAlbumsByArtist(
		@Param('artist', ParseSlugPipe) artistSlug: Slug) {
		let albums = await this.albumService.getAlbums({
			byArtist: { slug: artistSlug }
		});
		return albums;
	}

	@Get('/:artist/:album')
	async getAlbum(
		@Param('artist', ParseSlugPipe) artistSlug: Slug,
		@Param('album', ParseSlugPipe) albumSlug: Slug) {
		let album = await this.albumService.getAlbum({
			bySlug: { slug: albumSlug, artist: { slug: artistSlug } }
		});
		return album;
	}
}