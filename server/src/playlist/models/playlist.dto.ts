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

import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNumber, IsPositive } from "class-validator";
import { CreatePlaylist } from "src/prisma/models";

export class CreatePlaylistDTO extends PickType(CreatePlaylist, ["name"]) {}

export class UpdatePlaylistDTO extends PickType(CreatePlaylist, ["name"]) {}

export class CreatePlaylistEntryDTO {
	@ApiProperty({
		description: "The ID of the song",
	})
	@IsNumber()
	songId: number;
}

export class ReorderPlaylistDTO {
	@ApiProperty({
		description: "The IDs of the playlist's entries, ordered",
	})
	@IsPositive({ each: true })
	entryIds: number[];
}
