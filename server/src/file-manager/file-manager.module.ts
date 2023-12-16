import { Global, Module, forwardRef } from "@nestjs/common";
import SettingsModule from "src/settings/settings.module";
import FileManagerService from "./file-manager.service";

@Global()
@Module({
	imports: [forwardRef(() => SettingsModule)],
	providers: [FileManagerService],
	exports: [FileManagerService],
})
export default class FileManagerModule {}
