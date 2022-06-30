import { Module, forwardRef } from '@nestjs/common';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { FileModule } from 'src/file/file.module';
import { SettingsModule } from 'src/settings/settings.module';
import { MetadataModule } from 'src/metadata/metadata.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { IllustrationModule } from 'src/illustration/illustration.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule,
		FileModule,
		MetadataModule,
		forwardRef(() => IllustrationModule)
	],
	controllers: [LibraryController],
	providers: [LibraryService],
	exports: [LibraryService]
})
export class LibraryModule {}
