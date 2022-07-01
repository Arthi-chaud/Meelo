import { Module } from '@nestjs/common';
import FileModule from 'src/file/file.module';
import PrismaModule from 'src/prisma/prisma.module';
import ReleaseModule from 'src/release/release.module';
import SongModule from 'src/song/song.module';
import { TrackService } from './track.service';

@Module({
	imports: [
		PrismaModule,
		SongModule,
		ReleaseModule,
		FileModule
	],
	exports: [TrackService],
	providers: [TrackService]
})
export default class TrackModule {}
