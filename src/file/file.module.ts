import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileManagerModule } from 'src/file-manager/file-manager.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
	imports: [
		PrismaModule,
		FileManagerModule
	],
	providers: [FileService],
	exports: [FileService]
})
export class FileModule {}
