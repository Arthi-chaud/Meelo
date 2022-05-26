import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Artist } from './models/artist.model';
import { ArtistService } from './artist.service';

@Module({
	imports: [
		SequelizeModule.forFeature([Artist]),
	],
	providers: [ArtistService]
})
export class ArtistModule {}
