import { Module, forwardRef } from '@nestjs/common';
import PrismaModule from 'src/prisma/prisma.module';
import SongModule from 'src/song/song.module';
import { LyricsService } from './lyrics.service';
import { LyricsResponseBuilder } from './models/lyrics.response';

@Module({
	providers: [LyricsService, LyricsResponseBuilder],
	exports: [LyricsService, LyricsResponseBuilder],
	imports: [PrismaModule, forwardRef(() => SongModule)]
})
export class LyricsModule {}
