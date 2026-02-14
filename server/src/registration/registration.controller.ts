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

import { Body, Controller, Post, Put } from "@nestjs/common";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FormDataRequest, MemoryStoredFile } from "nestjs-form-data";
import { Role } from "src/authentication/roles/roles.decorators";
import RoleEnum from "src/authentication/roles/roles.enum";
import MetadataDto from "./models/metadata.dto";
import { RegistrationService } from "./registration.service";

@ApiTags("Registration")
@Controller("metadata")
export class MetadataController {
	constructor(private registrationService: RegistrationService) {}
	@ApiOperation({
		summary: "Submit a new file and its metadata",
		description:
			"Handles the metadata of a single media file, and creates the related artist, album, etc.",
	})
	@Post()
	@Role(RoleEnum.Microservice, RoleEnum.Admin)
	@ApiConsumes("multipart/form-data")
	@FormDataRequest({ storage: MemoryStoredFile })
	async saveFile(@Body() metadata: MetadataDto) {
		return this.registrationService.registerMetadata(metadata);
	}

	@ApiOperation({
		summary: "Update a file and its metadata",
		description:
			"Handles the metadata of a single media file, and updates the related artist, album, etc.",
	})
	@Put()
	@Role(RoleEnum.Microservice, RoleEnum.Admin)
	@ApiConsumes("multipart/form-data")
	@FormDataRequest({ storage: MemoryStoredFile })
	async updateFile(@Body() metadata: MetadataDto) {
		return this.registrationService.updateMetadata(metadata);
	}
}
