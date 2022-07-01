import { Module, forwardRef } from '@nestjs/common';
import AlbumService from './album.service';
import ArtistModule from 'src/artist/artist.module';
import PrismaModule from 'src/prisma/prisma.module';
import AlbumController from './album.controller';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => ArtistModule)
	],
	exports: [AlbumService],
	providers: [AlbumService],
	controllers: [AlbumController]
})
export default class AlbumModule {}
