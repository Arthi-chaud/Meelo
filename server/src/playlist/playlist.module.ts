import { Module, forwardRef } from "@nestjs/common";
import PlaylistController from './playlist.controller';
import PlaylistService from './playlist.service';
import PrismaModule from "src/prisma/prisma.module";
import PlaylistIllustrationService from "./playlist-illustration.service";
import SongModule from "src/song/song.module";
import SettingsModule from "src/settings/settings.module";
import { PlaylistResponseBuilder } from "./models/playlist.response";

@Module({
	imports: [PrismaModule, forwardRef(() => SongModule), SettingsModule],
	providers: [PlaylistService, PlaylistIllustrationService, PlaylistResponseBuilder],
	exports: [PlaylistService, PlaylistIllustrationService, PlaylistResponseBuilder],
	controllers: [PlaylistController]
})
export default class PlaylistModule {}
