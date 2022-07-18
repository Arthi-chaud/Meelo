import { Module, forwardRef } from '@nestjs/common';
import AlbumService from './album.service';
import ArtistModule from 'src/artist/artist.module';
import PrismaModule from 'src/prisma/prisma.module';
import AlbumController from './album.controller';
import ReleaseModule from 'src/release/release.module';
import IllustrationModule from 'src/illustration/illustration.module';
import TrackModule from 'src/track/track.module';
@Module({
	imports: [
		PrismaModule,
		forwardRef(() => IllustrationModule),
		forwardRef(() => ArtistModule),
		forwardRef(() => ReleaseModule),
		forwardRef(() => TrackModule)
	],
	exports: [AlbumService],
	providers: [AlbumService],
	controllers: [AlbumController]
})
export default class AlbumModule {}
