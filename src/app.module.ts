import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import FileModule from './file/file.module';
import ArtistModule from './artist/artist.module';
import AlbumModule from './album/album.module';
import ReleaseModule from './release/release.module';
import TrackModule from './track/track.module';
import SongModule from './song/song.module';
import SettingsModule from './settings/settings.module';
import LibraryModule from './library/library.module';
import IllustrationModule from './illustration/illustration.module';
import FileManagerModule from './file-manager/file-manager.module';
import MetadataModule from './metadata/metadata.module';
import PrismaModule from './prisma/prisma.module';
import { LyricsModule } from './lyrics/lyrics.module';
import SearchModule from './search/search.module';
import GenreModule from './genre/genre.module';
import AppController from './app.controller';
import { IllustrationMiddleware } from './illustration/illustration.middleware';

@Module({
	imports: [
		ConfigModule.forRoot(),
		ArtistModule,
		AlbumModule,
		SongModule,
		LibraryModule,
		TrackModule,
		ReleaseModule,
		IllustrationModule,
		MetadataModule,
		PrismaModule,
		FileModule,
		SettingsModule,
		FileManagerModule,
		GenreModule,
		SearchModule,
		LyricsModule,
	],
	controllers: [AppController],
	providers: [],
})
export default class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
		  .apply(IllustrationMiddleware)
		  .forRoutes({ path: '*/illustration', method: RequestMethod.ALL });
	}
}
