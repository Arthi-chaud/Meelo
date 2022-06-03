import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TrackService } from './track.service';

@Module({
	imports: [
		PrismaModule
	],
	exports: [TrackService],
	providers: [TrackService]
})
export class TrackModule {}
