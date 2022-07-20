import { Module, forwardRef } from '@nestjs/common';
import PrismaModule from 'src/prisma/prisma.module';
import SongModule from 'src/song/song.module';
import GenreService from './genre.service';

@Module({
	imports: [
		PrismaModule,
		forwardRef(() => SongModule)
	],
	providers: [GenreService],
	exports: [GenreService]
})
export default class GenreModule { }
