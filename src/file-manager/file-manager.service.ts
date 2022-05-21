import { Injectable } from '@nestjs/common';
import { SettingsService } from 'src/settings/settings.service';
import md5File from 'md5-file';

@Injectable()
export class FileManagerService {
	constructor(private settingsService: SettingsService) {}

	/**
	 * Compute the MD5 checksum of a file
	 * @param filePath The Path to a file, whose MD5 checksum will be computed
	 * @returns the MD5 Checksum as a string
	 */
	getMd5Checksum(filePath: string) {
		return md5File.sync(filePath);
	}
}
