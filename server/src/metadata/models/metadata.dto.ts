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

import { ApiProperty } from "@nestjs/swagger";
import { IsDefined, IsNotEmpty } from "class-validator";
import {
	HasMimeType,
	IsFile,
	MaxFileSize,
	MemoryStoredFile,
} from "nestjs-form-data";
import Metadata from "src/scanner/models/metadata";

export default class MetadataDto extends Metadata {
	@IsDefined()
	@IsNotEmpty()
	@ApiProperty({
		description:
			"Absolute path of the file. An error will be returned if the path is not absolute, or does not belong to any library",
	})
	path: string;

	@IsFile()
	@ApiProperty({
		type: "file",
		properties: {
			file: {
				type: "string",
				format: "binary",
			},
		},
	})
	@HasMimeType(["image/*"])
	@MaxFileSize(20 * 1e6)
	illustration?: MemoryStoredFile;
}
