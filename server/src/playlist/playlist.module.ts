import { Module, forwardRef } from "@nestjs/common";
import PlaylistService from './playlist.service';
import PrismaModule from "src/prisma/prisma.module";
import PlaylistIllustrationService from "./playlist-illustration.service";
import SongModule from "src/song/song.module";
import SettingsModule from "src/settings/settings.module";

@Module({
	imports: [PrismaModule, forwardRef(() => SongModule), SettingsModule],
	providers: [PlaylistService, PlaylistIllustrationService],
	exports: [PlaylistService, PlaylistIllustrationService]
})
export default class PlaylistModule {}
