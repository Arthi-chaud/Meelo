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

import { forwardRef, Module } from "@nestjs/common";
import IllustrationModule from "src/illustration/illustration.module";
import PrismaModule from "src/prisma/prisma.module";
import SettingsModule from "src/settings/settings.module";
import SongModule from "src/song/song.module";
import {
	PlaylistEntryResponseBuilder,
	PlaylistResponseBuilder,
} from "./models/playlist.response";
import PlaylistController from "./playlist.controller";
import PlaylistService from "./playlist.service";

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => SettingsModule),
		forwardRef(() => IllustrationModule),
	],
	providers: [
		PlaylistService,
		PlaylistResponseBuilder,
		PlaylistEntryResponseBuilder,
	],
	exports: [
		PlaylistService,
		PlaylistResponseBuilder,
		PlaylistEntryResponseBuilder,
	],
	controllers: [PlaylistController],
})
export default class PlaylistModule {}
