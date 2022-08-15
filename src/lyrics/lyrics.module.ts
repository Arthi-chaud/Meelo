import { Module } from '@nestjs/common';
import { LyricsService } from './lyrics.service';

@Module({
  providers: [LyricsService]
})
export class LyricsModule {}
