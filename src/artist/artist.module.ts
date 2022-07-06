import { Module } from '@nestjs/common';
import ArtistService from './artist.service';
import PrismaModule from 'src/prisma/prisma.module';
import ArtistController from './artist.controller';

@Module({
	imports: [
		PrismaModule
	],
	exports: [ArtistService],
	providers: [ArtistService],
	controllers: [ArtistController]
})
export default class ArtistModule {}
