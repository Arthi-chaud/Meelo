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

import {
	Body,
	Controller,
	Injectable,
	Post,
	UploadedFile,
	UseInterceptors,
} from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import ProviderService from "./provider.service";
import { CreatePlaylistDTO } from "src/playlist/models/playlist.dto";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import IllustrationRepository from "src/illustration/illustration.repository";
import IdentifierParam from "src/identifier/identifier.pipe";
import ProviderQueryParameters from "./models/provider.query-parameters";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("External Metadata")
@Controller("external-providers")
@Injectable()
export default class ProviderController {
	constructor(
		private providerService: ProviderService,
		private illustrationRepository: IllustrationRepository,
	) {}

	@Post()
	@Role(Roles.Admin, Roles.Microservice)
	@ApiOperation({
		summary: "Save a Provider",
	})
	async createProvider(@Body() dto: CreatePlaylistDTO) {
		return this.providerService.create(dto.name);
	}

	@Post(":idOrSlug/icon")
	@ApiOperation({
		summary: "Save a provider's icon",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@ApiConsumes("multipart/form-data")
	@ApiBody({
		schema: {
			type: "object",
			properties: {
				icon: {
					type: "string",
					format: "binary",
				},
			},
		},
	})
	@UseInterceptors(FileInterceptor("icon"))
	async saveProviderIcon(
		@IdentifierParam(ProviderService)
		where: ProviderQueryParameters.WhereInput,
		@UploadedFile() file: Express.Multer.File,
	) {
		return this.illustrationRepository.saveProviderIcon(file.buffer, where);
	}
}
