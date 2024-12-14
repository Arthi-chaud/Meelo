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
import { parse } from "path";
import { NoIllustrationException } from "./illustration.exceptions";
import ProviderIllustrationService from "src/providers/provider-illustration.service";
import ProviderService from "src/providers/provider.service";
import ProvidersSettings from "src/providers/models/providers.settings";
import { UnknownProviderError } from "src/providers/provider.exception";
import IllustrationRepository from "./illustration.repository";
import { IllustrationResponse } from "./models/illustration.response";
import Roles from "src/authentication/roles/roles.enum";
import IllustrationRegistrationDto from "./models/illustration-registration.dto";
import { FormDataRequest, MemoryStoredFile } from "nestjs-form-data";
import { RegistrationService } from "src/registration/registration.service";

const Cached = () => Header("Cache-Control", `max-age=${3600 * 24}`);

@ApiTags("Illustrations")
@Controller("illustrations")
export class IllustrationController {
	constructor(
		private illustrationService: IllustrationService,
		private illustrationRepository: IllustrationRepository,
		private registrationService: RegistrationService,
		private providerIllustrationService: ProviderIllustrationService,
		private providerService: ProviderService,
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
			.catch((err) => {
				if (err instanceof NoIllustrationException) {
					this.illustrationRepository.deleteIllustration(
						illustration.id,
					);
				}
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

	@ApiOperation({
		summary: "Get a Provider's icon",
	})
	@Cached()
	@Get("providers/:name/icon")
	async getProviderIillustration(
		@Param("name") providerName: string,
		@Query() dimensions: IllustrationDimensionsDto,
		@Response({ passthrough: true }) res: Response,
	) {
		const pNameIsValid = (str: string): str is keyof ProvidersSettings =>
			this.providerService.providerCatalogue.find(
				({ name }) => name == str,
			) !== undefined;
		let illustrationPath = "";

		if (!pNameIsValid(providerName)) {
			throw new UnknownProviderError(providerName);
		}
		illustrationPath =
			this.providerIllustrationService.buildIconPath(providerName);
		return this.illustrationService.streamIllustration(
			illustrationPath,
			`${providerName}-${parse(illustrationPath).name}`,
			dimensions,
			res,
			parse(illustrationPath).ext,
		);
	}
}
