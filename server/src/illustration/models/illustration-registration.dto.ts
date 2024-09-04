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

import { ApiPropertyOptional } from "@nestjs/swagger";
import { IllustrationType } from "@prisma/client";
import { IsDefined, IsEnum, IsIn, IsNumber, IsString } from "class-validator";
import {
	HasMimeType,
	IsFile,
	MaxFileSize,
	MemoryStoredFile,
} from "nestjs-form-data";

export default class IllustrationRegistrationDto {
	@IsFile()
	@IsDefined()
	@ApiPropertyOptional({
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
	file: MemoryStoredFile;

	@IsNumber()
	@IsDefined()
	trackId: number;

	@IsEnum(IllustrationType)
	@IsIn([IllustrationType.Cover, IllustrationType.Thumbnail])
	@IsString()
	@IsDefined()
	@ApiPropertyOptional({
		enum: [IllustrationType.Cover, IllustrationType.Thumbnail],
	})
	type: IllustrationType;
}
