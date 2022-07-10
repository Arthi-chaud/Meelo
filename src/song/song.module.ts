import { Module, forwardRef } from '@nestjs/common';
import { SongController } from './song.controller';
import ArtistModule from 'src/artist/artist.module';
import PrismaModule from 'src/prisma/prisma.module';
import SongService from './song.service';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => ArtistModule),
	],
	exports: [SongService],
	providers: [SongService],
	controllers: [SongController]
})
export default class SongModule {}
