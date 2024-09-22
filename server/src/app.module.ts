/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import FileModule from "./file/file.module";
import ArtistModule from "./artist/artist.module";
import AlbumModule from "./album/album.module";
import ReleaseModule from "./release/release.module";
import TrackModule from "./track/track.module";
import SongModule from "./song/song.module";
import SettingsModule from "./settings/settings.module";
import LibraryModule from "./library/library.module";
import IllustrationModule from "./illustration/illustration.module";
import FileManagerModule from "./file-manager/file-manager.module";
import PrismaModule from "./prisma/prisma.module";
import { LyricsModule } from "./lyrics/lyrics.module";
import GenreModule from "./genre/genre.module";
import AppController from "./app.controller";
import { ScheduleModule } from "@nestjs/schedule";
import AuthenticationModule from "./authentication/authentication.module";
import UserModule from "./user/user.module";
import LoggerModule from "./logger/logger.module";
import * as Plugins from "./app.plugins";
import VideoModule from "./video/video.module";
import PlaylistModule from "./playlist/playlist.module";
import { MeiliSearchModule } from "nestjs-meilisearch";
import { StreamModule } from "./stream/stream.module";
import { SearchModule } from "./search/search.module";
import { RegistrationModule } from "./registration/registration.module";
import { MemoryStoredFile, NestjsFormDataModule } from "nestjs-form-data";
import { HousekeepingModule } from "./housekeeping/housekeeping.module";
import { ExternalMetadataModule } from "./external-metadata/external-metadata.module";
import ParserModule from "./parser/parser.module";
import { RabbitMQModule } from "@golevelup/nestjs-rabbitmq";

@Module({
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot(),
		MeiliSearchModule.forRoot({
			host: process.env.MEILI_HOST!,
			apiKey: process.env.MEILI_MASTER_KEY,
		}),
		NestjsFormDataModule.config({
			storage: MemoryStoredFile,
			isGlobal: true,
			cleanupAfterSuccessHandle: true,
			cleanupAfterFailedHandle: true,
		}),
		RabbitMQModule.forRoot(RabbitMQModule, {
			uri: process.env.RABBITMQ_URL!,
		}),
		ArtistModule,
		AlbumModule,
		SongModule,
		LibraryModule,
		TrackModule,
		ReleaseModule,
		IllustrationModule,
		PrismaModule,
		FileModule,
		SettingsModule,
		FileManagerModule,
		GenreModule,
		LyricsModule,
		AuthenticationModule,
		UserModule,
		LoggerModule,
		PlaylistModule,
		VideoModule,
		StreamModule,
		SearchModule,
		RegistrationModule,
		ParserModule,
		HousekeepingModule,
		ExternalMetadataModule,
	],
	controllers: [AppController],
	providers: Plugins.AppProviders,
})
export default class AppModule {
	configure(consumer: MiddlewareConsumer) {
		Plugins.applyMiddlewares(consumer);
	}
}
