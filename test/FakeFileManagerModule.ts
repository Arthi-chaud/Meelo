import { forwardRef, Injectable, Module } from "@nestjs/common";
import { FileManagerModule } from "src/file-manager/file-manager.module";
import { FileManagerService } from "src/file-manager/file-manager.service";
import { SettingsModule } from "src/settings/settings.module";

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