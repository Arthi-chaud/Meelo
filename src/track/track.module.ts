import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Track } from './models/track.model';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Track
		])
	]
})
export class TrackModule {}
