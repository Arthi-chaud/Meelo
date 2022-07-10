import { Module, forwardRef } from '@nestjs/common';
import AlbumService from './album.service';
import ArtistModule from 'src/artist/artist.module';
import PrismaModule from 'src/prisma/prisma.module';
import AlbumController from './album.controller';
import ReleaseModule from 'src/release/release.module';
@Module({
	imports: [
		PrismaModule,
		ArtistModule,
		forwardRef(() => ReleaseModule)
	],
	exports: [AlbumService],
	providers: [AlbumService],
	controllers: [AlbumController]
})
export default class AlbumModule {}
