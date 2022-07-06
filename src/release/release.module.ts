import { Module } from '@nestjs/common';
import AlbumModule from 'src/album/album.module';
import PrismaModule from 'src/prisma/prisma.module';
import ReleaseService from './release.service';

@Module({
	imports: [
		PrismaModule,
		AlbumModule
	],
	providers: [ReleaseService],
	exports: [ReleaseService]
})
export default class ReleaseModule {}
