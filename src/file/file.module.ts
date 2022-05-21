import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { File } from './models/file.model';
import { FileService } from './file.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { SettingsModule } from 'src/settings/settings.module';

@Module({
	imports: [
		SequelizeModule.forFeature([File]),
		FileManagerModule,
		SettingsModule
	],
	providers: [FileService],
	exports: [FileService]
})
export class FileModule {}
