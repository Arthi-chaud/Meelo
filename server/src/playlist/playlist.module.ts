import { Module, forwardRef } from "@nestjs/common";
import PlaylistController from "./playlist.controller";
import PlaylistService from "./playlist.service";
import PrismaModule from "src/prisma/prisma.module";
import SongModule from "src/song/song.module";
import SettingsModule from "src/settings/settings.module";
import { PlaylistResponseBuilder } from "./models/playlist.response";
import IllustrationModule from "src/illustration/illustration.module";

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		SettingsModule,
		forwardRef(() => IllustrationModule),
	],
	providers: [PlaylistService, PlaylistResponseBuilder],
	exports: [PlaylistService, PlaylistResponseBuilder],
	controllers: [PlaylistController],
})
export default class PlaylistModule {}
