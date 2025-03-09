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
import { IsDefined, IsNumber, IsString } from "class-validator";

export class SyncedLyric {
	@ApiProperty({ description: "The line at that timestamp" })
	@IsString()
	@IsDefined()
	content: string;

	@ApiProperty({
		description: "The timestamp or the lyrics line. Time is in seconds",
	})
	@IsNumber()
	@IsDefined()
	timestamp: number;
}

export class LyricsResponse {
	@ApiProperty({
		description:
			"A new-line-separated string, representing the plain lyrics of a song",
	})
	plain: string;

	@ApiProperty({
		type: SyncedLyric,
		isArray: true,
		nullable: true,
	})
	synced: SyncedLyric[] | null;
}
