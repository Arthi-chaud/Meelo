import { Module, forwardRef } from '@nestjs/common';
import PrismaModule from 'src/prisma/prisma.module';
import SongModule from 'src/song/song.module';
import { LyricsService } from './lyrics.service';

@Module({
  providers: [LyricsService],
  exports: [LyricsService],
  imports: [PrismaModule, forwardRef(() => SongModule),]
})
export class LyricsModule {}
