import { Module } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import ArtistModule from 'src/artist/artist.module';
import GenreModule from 'src/genre/genre.module';
import ReleaseModule from 'src/release/release.module';
import SongModule from 'src/song/song.module';
import SearchController from './search.controller';
import { SearchAllResponseBuilder } from './models/search-all.response';
import IllustrationModule from 'src/illustration/illustration.module';

@Module({
	imports: [
		ArtistModule,
		AlbumModule,
		SongModule,
		ReleaseModule,
		GenreModule,
		IllustrationModule
	],
	controllers: [SearchController],
	providers: [SearchAllResponseBuilder]
})
export default class SearchModule {}
