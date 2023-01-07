import { Module, forwardRef } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import FileModule from 'src/file/file.module';
import IllustrationModule from 'src/illustration/illustration.module';
import PrismaModule from 'src/prisma/prisma.module';
import TrackModule from 'src/track/track.module';
import ReleaseController from './release.controller';
import ReleaseService from './release.service';
import { ReleaseResponseBuilder } from './models/release.response';
import ArtistModule from 'src/artist/artist.module';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => AlbumModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => TrackModule),
		forwardRef(() => IllustrationModule),
		forwardRef(() => FileModule)
	],
	controllers: [ReleaseController],
	providers: [ReleaseService, ReleaseResponseBuilder],
	exports: [ReleaseService, ReleaseResponseBuilder]
})
export default class ReleaseModule {}
