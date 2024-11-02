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

import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateSearchHistoryEntry } from "./models/create-search-history-entry.dto";
import { SearchHistoryService } from "./search-history.service";
import Roles from "src/authentication/roles/roles.enum";
import { Role } from "src/authentication/roles/roles.decorators";
import { User } from "src/prisma/models";

@ApiTags("Search")
@Controller("search/history")
export class SearchHistoryController {
	constructor(private searchHistoryService: SearchHistoryService) {}
	@ApiOperation({
		summary: "Save a searched item",
	})
	@Role(Roles.User)
	@Post()
	async createSearchHistoryEntry(
		@Body() dto: CreateSearchHistoryEntry,
		@Req() request: Express.Request,
	) {
		return this.searchHistoryService.createEntry(
			dto,
			(request.user as User).id,
		);
	}
}
