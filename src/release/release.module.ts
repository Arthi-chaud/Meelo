import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Release } from './models/release.model';

@Module({
	imports: [
		SequelizeModule.forFeature([
			Release,
		])
	]
})
export class ReleaseModule {}
