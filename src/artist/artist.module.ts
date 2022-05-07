import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Artist } from './models/artist.model';

@Module({
	imports: [
		SequelizeModule.forFeature([Artist]),
	]
})
export class ArtistModule {}
