import { Module } from '@nestjs/common';
import { ArtistModule } from 'src/artist/artist.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SongService } from './song.service';

@Module({
	imports: [
		PrismaModule,
		ArtistModule
	],
	exports: [SongService],
	providers: [SongService]
})
export class SongModule {}
