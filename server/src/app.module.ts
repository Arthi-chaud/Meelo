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

import { type MiddlewareConsumer, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { MemoryStoredFile, NestjsFormDataModule } from "nestjs-form-data";
import { MeiliSearchModule } from "nestjs-meilisearch";
import AlbumModule from "./album/album.module";
import AppController from "./app.controller";
import * as Plugins from "./app.plugins";
import ArtistModule from "./artist/artist.module";
import AuthenticationModule from "./authentication/authentication.module";
import { EventsModule } from "./events/events.module";
import { ExternalMetadataModule } from "./external-metadata/external-metadata.module";
import FileModule from "./file/file.module";
import FileManagerModule from "./file-manager/file-manager.module";
import GenreModule from "./genre/genre.module";
import { HousekeepingModule } from "./housekeeping/housekeeping.module";
import IllustrationModule from "./illustration/illustration.module";
import LabelModule from "./label/label.module";
import LibraryModule from "./library/library.module";
import LoggerModule from "./logger/logger.module";
import { LyricsModule } from "./lyrics/lyrics.module";
import ParserModule from "./parser/parser.module";
import PlaylistModule from "./playlist/playlist.module";
import PrismaModule from "./prisma/prisma.module";
import { RegistrationModule } from "./registration/registration.module";
import ReleaseModule from "./release/release.module";
import ScrobblerModule from "./scrobbler/scrobbler.module";
import { SearchModule } from "./search/search.module";
import SettingsModule from "./settings/settings.module";
import SongModule from "./song/song.module";
import { StreamModule } from "./stream/stream.module";
import TrackModule from "./track/track.module";
import UserModule from "./user/user.module";
import VideoModule from "./video/video.module";

@Module({
	imports: [
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
		ScheduleModule.forRoot(),
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
		EventsModule,
		LabelModule,
		ScrobblerModule,
	],
	controllers: [AppController],
	providers: Plugins.AppProviders,
})
export default class AppModule {
	configure(consumer: MiddlewareConsumer) {
		Plugins.applyMiddlewares(consumer);
	}
}
