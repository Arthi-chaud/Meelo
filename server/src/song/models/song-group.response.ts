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
import { SongResponse, SongResponseBuilder } from "./song.response";
import { Injectable } from "@nestjs/common";
import { SongWithRelations } from "src/prisma/models";

export class SongGroupResponse extends SongResponse {
	@ApiProperty()
	versionCount: number;
}

@Injectable()
export class SongGroupResponseBuilder extends SongResponseBuilder {
	async buildResponse(
		song: SongWithRelations & { versionCount: number },
	): Promise<SongGroupResponse> {
		return {
			...(await super.buildResponse(song)),
			versionCount: song.versionCount,
		};
	}
}
