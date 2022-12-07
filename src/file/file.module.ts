import { Module, forwardRef } from '@nestjs/common';
import FileService from './file.service';
import FileManagerModule from 'src/file-manager/file-manager.module';
import PrismaModule from 'src/prisma/prisma.module';
import FileController from './file.controller';
import SettingsModule from 'src/settings/settings.module';
import LibraryModule from 'src/library/library.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule,
		SettingsModule,
		forwardRef(() => LibraryModule)
	],
	providers: [FileService],
	exports: [FileService],
	controllers: [FileController]
})
export default class FileModule {}
