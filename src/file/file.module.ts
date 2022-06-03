import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { SettingsModule } from 'src/settings/settings.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule,
		SettingsModule
	],
	providers: [FileService],
	exports: [FileService]
})
export class FileModule {}
