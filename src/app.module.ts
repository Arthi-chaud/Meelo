import {
	MiddlewareConsumer, Module, RequestMethod
} from '@nestjs/common';
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
import TasksModule from './tasks/tasks.module';
import { ScheduleModule } from '@nestjs/schedule';
import AuthenticationModule from './authentication/authentication.module';
import UserModule from './user/user.module';
import { APP_GUARD } from '@nestjs/core';
import JwtAuthGuard from './authentication/jwt/jwt-auth.guard';
import RolesGuard from './roles/roles.guard';
import JwtCookieMiddleware from './authentication/jwt/jwt-middleware';

@Module({
	imports: [
		ScheduleModule.forRoot(),
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
		TasksModule,
		AuthenticationModule,
		UserModule
	],
	controllers: [AppController],
	providers: [
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
		{
			provide: APP_GUARD,
			useClass: RolesGuard,
		}
	],
})
export default class AppModule {
	configure(consumer: MiddlewareConsumer) {
		consumer
			.apply(JwtCookieMiddleware)
			.forRoutes({ path: '*', method: RequestMethod.ALL });
	}
}
