/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Module } from "@nestjs/common";
import { MetadataController } from "./metadata.controller";
import { MetadataService } from "./metadata.service";
import ScannerModule from "src/scanner/scanner.module";
import SettingsModule from "src/settings/settings.module";
import LibraryModule from "src/library/library.module";
import FileModule from "src/file/file.module";
import TasksModule from "src/tasks/tasks.module";

@Module({
	controllers: [MetadataController],
	providers: [MetadataService],
	imports: [
		ScannerModule,
		SettingsModule,
		LibraryModule,
		FileModule,
		TasksModule,
	],
})
export class MetadataModule {}
