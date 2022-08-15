import { Module } from '@nestjs/common';
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
import { UrlGeneratorModule, UrlGeneratorModuleOptions } from 'nestjs-url-generator';
import { LyricsModule } from './lyrics/lyrics.module';
import SearchModule from './search/search.module';
import GenreModule from './genre/genre.module';
import AppController from './app.controller';

@Module({
	imports: [
		ConfigModule.forRoot(),
		UrlGeneratorModule.forRootAsync({
			useFactory: () => (<UrlGeneratorModuleOptions>{
				appUrl: process.env.APP_URL!,
			}),
		}),
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
export default class AppModule {}
