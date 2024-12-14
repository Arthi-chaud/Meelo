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
	Delete,
	Get,
	Header,
	Param,
	ParseIntPipe,
	Post,
	Query,
	Response,
} from "@nestjs/common";
import { ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import IllustrationService from "./illustration.service";
import { IllustrationDimensionsDto } from "./models/illustration-dimensions.dto";
import { Admin, Role } from "src/authentication/roles/roles.decorators";
import { NoIllustrationException } from "./illustration.exceptions";
import IllustrationRepository from "./illustration.repository";
import { IllustrationResponse } from "./models/illustration.response";
import Roles from "src/authentication/roles/roles.enum";
import IllustrationRegistrationDto from "./models/illustration-registration.dto";
import { FormDataRequest, MemoryStoredFile } from "nestjs-form-data";
import { RegistrationService } from "src/registration/registration.service";
import { IllustrationDownloadDto } from "./models/illustration-dl.dto";

const Cached = () => Header("Cache-Control", `max-age=${3600 * 24}`);

@ApiTags("Illustrations")
@Controller("illustrations")
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private illustrationRepository: IllustrationRepository,
		private registrationService: RegistrationService,
	) {}

	@ApiOperation({
		summary: "Get an illustration",
	})
	@Cached()
	@Get(":id")
	async getIllustration(
		@Param("id", new ParseIntPipe())
		illustrationId: number,
		@Response({ passthrough: true })
		res: Response,
		@Query() dimensions: IllustrationDimensionsDto,
	) {
		const illustration = await this.illustrationRepository.getIllustration(
			illustrationId,
		);
		const illustrationPath =
			this.illustrationRepository.buildIllustrationPath(illustration.id);

		return this.illustrationService
			.streamIllustration(
				illustrationPath,
				"illustration",
				dimensions,
				res,
			)
			.catch(() => {
				throw new NoIllustrationException(
					"Illustration file not found",
				);
			});
	}

	@ApiOperation({
		summary: "Register an illustration from a file",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Post("file")
	@ApiConsumes("multipart/form-data")
	@FormDataRequest({ storage: MemoryStoredFile })
	async registerIllustration(@Body() dto: IllustrationRegistrationDto) {
		return this.registrationService.registerTrackIllustration(
			{
				id: dto.trackId,
			},
			dto.file.buffer,
			dto.type,
		);
	}

	@ApiOperation({
		summary: "Save an illustration from a url",
	})
	@Role(Roles.Admin, Roles.Microservice)
	@Post("url")
	async saveIllustration(@Body() dto: IllustrationDownloadDto) {
		return this.illustrationRepository.saveIllustrationFromUrl(dto);
	}

	@ApiOperation({
		summary: "Get info about an illustration",
	})
	@Cached()
	@Get(":id/info")
	async getIllustrationInfo(
		@Param("id", new ParseIntPipe())
		illustrationId: number,
	): Promise<IllustrationResponse> {
		const illustration = await this.illustrationRepository.getIllustration(
			illustrationId,
		);

		return IllustrationResponse.from(illustration);
	}

	@ApiOperation({
		summary: "Delete an illustration",
	})
	@Admin()
	@Delete(":id")
	async deleteIllustration(
		@Param("id", new ParseIntPipe())
		illustrationId: number,
	) {
		// Note: `deleteIllustration` now fails silently to avoid crash during housekeeping
		// This is a hot fixto have a 404 when image does not exist.
		await this.illustrationRepository.getIllustration(illustrationId);
		await this.illustrationRepository.deleteIllustration(illustrationId);
	}
}
