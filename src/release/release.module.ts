import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AlbumModule } from 'src/album/album.module';
import { AlbumService } from 'src/album/album.service';
import { Release } from './models/release.model';
import { ReleaseService } from './release.service';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Release,
		]),
		AlbumModule
	],
	providers: [ReleaseService],
	exports: [ReleaseService]
})
export class ReleaseModule {}
