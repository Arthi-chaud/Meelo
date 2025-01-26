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

import { Body, Controller, Get, Injectable, Post, Query } from "@nestjs/common";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import { FormDataRequest, MemoryStoredFile } from "nestjs-form-data";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import IdentifierParam from "src/identifier/identifier.pipe";
import IllustrationRepository from "src/illustration/illustration.repository";
import { PaginationParameters } from "src/pagination/models/pagination-parameters";
import { type Illustration, Provider } from "src/prisma/models";
import Response, { ResponseType } from "src/response/response.decorator";
import {
	CreateProviderDTO,
	ProviderIconRegistrationDto,
} from "./models/provider.dto";
import type ProviderQueryParameters from "./models/provider.query-parameters";
import ProviderService from "./provider.service";

@ApiTags("External Metadata")
@Controller("external-providers")
@Injectable()
export default class ProviderController {
	constructor(
		private providerService: ProviderService,
		private illustrationRepository: IllustrationRepository,
	) {}

	@Get()
	@Response({
		returns: Provider,
		type: ResponseType.Page,
	})
	@Role(Roles.Default, Roles.Microservice)
	@ApiOperation({
		summary: "Get many providers",
	})
	async getProviders(
		@Query()
		paginationParameters: PaginationParameters,
	) {
		return this.providerService.getMany(paginationParameters);
	}

	@Post()
	@Role(Roles.Admin, Roles.Microservice)
	@ApiOperation({
		summary: "Save a provider",
	})
	async createProvider(@Body() dto: CreateProviderDTO): Promise<Provider> {
		return this.providerService.create(dto.name);
	}

	@Post(":idOrSlug/icon")
	@ApiOperation({
		summary: "Save a provider's icon",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@ApiConsumes("multipart/form-data")
	@FormDataRequest({ storage: MemoryStoredFile })
	async saveProviderIcon(
		@IdentifierParam(ProviderService)
		where: ProviderQueryParameters.WhereInput,
		@Body() dto: ProviderIconRegistrationDto,
	): Promise<Illustration> {
		return this.illustrationRepository.saveProviderIcon(
			dto.file.buffer,
			where,
		);
	}
}
