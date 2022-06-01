import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Track } from './models/track.model';
import { TrackService } from './track.service';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Track
		])
	],
	providers: [TrackService]
})
export class TrackModule {}
