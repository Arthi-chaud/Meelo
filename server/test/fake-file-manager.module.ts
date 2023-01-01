import { Injectable } from "@nestjs/common";
import FileManagerService from "src/file-manager/file-manager.service";

@Injectable()
export class FakeFileManagerService extends FileManagerService {
}

export const FakeFileManagerModule = {
	provide: FileManagerService,
	useClass: FakeFileManagerService
};