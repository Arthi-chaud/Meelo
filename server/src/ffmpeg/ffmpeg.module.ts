import { Module } from '@nestjs/common';
import FfmpegService from './ffmpeg.service';
import FileManagerModule from 'src/file-manager/file-manager.module';

@Module({
	imports: [FileManagerModule],
	exports: [FfmpegService],
	providers: [FfmpegService]
})
export default class FfmpegModule {}
