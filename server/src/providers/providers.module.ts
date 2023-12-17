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

import { Module, forwardRef } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import ProviderService from "./provider.service";
import SettingsModule from "src/settings/settings.module";
import GeniusProvider from "./genius/genius.provider";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";
import PrismaModule from "src/prisma/prisma.module";
import { ExternalIdResponseBuilder } from "./models/external-id.response";
import ExternalIdService from "./external-id.provider";
import ProvidersIllustrationService from "./provider-illustration.service";
import IllustrationModule from "src/illustration/illustration.module";
import DiscogsProvider from "./discogs/discogs.provider";
import WikipediaProvider from "./wikipedia/wikipedia.provider";
import MetacriticProvider from "./metacritic/metacritic.provider";
import AllMusicProvider from "./allmusic/allmusic.provider";
import GenreModule from "src/genre/genre.module";

@Module({
	imports: [
		HttpModule,
		SettingsModule,
		PrismaModule,
		forwardRef(() => GenreModule),
		forwardRef(() => IllustrationModule),
	],
	providers: [
		WikipediaProvider,
		GeniusProvider,
		MusicBrainzProvider,
		DiscogsProvider,
		MetacriticProvider,
		AllMusicProvider,
		ProviderService,
		ProvidersIllustrationService,
		ExternalIdService,
		ExternalIdResponseBuilder,
	],
	exports: [
		WikipediaProvider,
		MetacriticProvider,
		AllMusicProvider,
		DiscogsProvider,
		ProviderService,
		ProvidersIllustrationService,
		ExternalIdService,
		ExternalIdResponseBuilder,
	],
})
export default class ProvidersModule {}
