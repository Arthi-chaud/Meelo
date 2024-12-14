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
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class IllustrationDownloadDto {
	@ApiProperty({
		description: "The URL of the illustration to download",
	})
	@IsString()
	@IsNotEmpty()
	url: string;
	@ApiProperty()
	@IsOptional()
	@IsNumber()
	trackId?: number | null;
	@ApiProperty()
	@IsOptional()
	@IsNumber()
	artistId?: number | null;
	@ApiProperty()
	@IsOptional()
	@IsNumber()
	playlistId?: number | null;
	@ApiProperty()
	@IsOptional()
	@IsNumber()
	releaseId?: number | null;
}
