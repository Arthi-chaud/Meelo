import { Module } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { FileModule } from 'src/file/file.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule,
		FileModule,
		MetadataModule
	],
	controllers: [LibraryController],
	providers: [LibraryService]
})
export class LibraryModule {}
