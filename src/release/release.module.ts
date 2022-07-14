import { Module, forwardRef } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import IllustrationModule from 'src/illustration/illustration.module';
import PrismaModule from 'src/prisma/prisma.module';
import TrackModule from 'src/track/track.module';
import ReleaseController from './release.controller';
import ReleaseService from './release.service';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => AlbumModule),
		forwardRef(() => TrackModule),
		forwardRef(() => IllustrationModule)
	],
	controllers: [ReleaseController],
	providers: [ReleaseService],
	exports: [ReleaseService]
})
export default class ReleaseModule {}
