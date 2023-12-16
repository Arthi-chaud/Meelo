import { Module, forwardRef } from "@nestjs/common";
import PrismaModule from "src/prisma/prisma.module";
import SongModule from "src/song/song.module";
import { LyricsService } from "./lyrics.service";
import { LyricsResponseBuilder } from "./models/lyrics.response";
import ProvidersModule from "src/providers/providers.module";

@Module({
	providers: [LyricsService, LyricsResponseBuilder],
	exports: [LyricsService, LyricsResponseBuilder],
	imports: [
		PrismaModule,
		forwardRef(() => SongModule),
		forwardRef(() => ProvidersModule),
	],
})
export class LyricsModule {}
