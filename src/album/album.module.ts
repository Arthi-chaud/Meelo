import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Album } from './models/album.model';
import { AlbumService } from './album.service';

@Module({
	imports: [
		SequelizeModule.forFeature([Album])
	],
	providers: [AlbumService]
})
export class AlbumModule {}
