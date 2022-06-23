import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ReleaseModule } from 'src/release/release.module';
import { SongModule } from 'src/song/song.module';
import { TrackService } from './track.service';

@Module({
	imports: [
		PrismaModule,
		SongModule,
		ReleaseModule
	],
	exports: [TrackService],
	providers: [TrackService]
})
export class TrackModule {}
