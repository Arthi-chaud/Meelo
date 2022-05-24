import { Injectable } from '@nestjs/common';
import { FileManagerService } from 'src/file-manager/file-manager.service';

@Injectable()
export class MetadataService {
	public readonly metadataFolderPath;
	constructor(private fileManagerService: FileManagerService) {
		this.metadataFolderPath = `${this.fileManagerService.configFolderPath}/metadata`;
	}
}
