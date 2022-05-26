import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Release } from './models/release.model';
import { ReleaseService } from './release.service';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Release,
		])
	],
	providers: [ReleaseService]
})
export class ReleaseModule {}
