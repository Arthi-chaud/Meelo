import { Injectable } from "@nestjs/common";
import { FileManagerService } from "src/file-manager/file-manager.service";

@Injectable()
export class FakeFileManagerService extends FileManagerService {
	override get configFolderPath(): string {
		return 'test/assets';
	}
}

export let FakeFileManagerModule = {
	provide: FileManagerService,
	useClass: FakeFileManagerService
};