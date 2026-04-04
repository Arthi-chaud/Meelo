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

import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Role } from "src/authentication/roles/roles.decorators";
import Roles from "src/authentication/roles/roles.enum";
import IdentifierParam from "src/identifier/identifier.pipe";
import { Area } from "src/prisma/generated/client";
import CreateAreaDTO from "./area.dto";
import AreaQueryParameters from "./area.query-parameters";
import AreaService from "./area.service";

@ApiTags("Areas")
@Controller("areas")
export default class AreaController {
	constructor(private areaService: AreaService) {}

	@Post()
	@ApiOperation({ summary: "Create an area" })
	@Role(Roles.Default, Roles.Microservice)
	async create(@Body() dto: CreateAreaDTO): Promise<Area> {
		return this.areaService.create(dto);
	}

	@Get(":idOrSlug")
	@ApiOperation({ summary: "Get an area" })
	@Role(Roles.Default, Roles.Microservice)
	async get(
		@IdentifierParam(AreaService)
		where: AreaQueryParameters.WhereInput,
	): Promise<Area> {
		return this.areaService.get(where);
	}

	//TODO: Get parent
}
