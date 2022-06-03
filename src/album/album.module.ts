import { Module } from '@nestjs/common';
import { AlbumService } from './album.service';
import { ArtistModule } from 'src/artist/artist.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [
		PrismaModule,
		ArtistModule
	],
	exports: [AlbumService],
	providers: [AlbumService]
})
export class AlbumModule {}
