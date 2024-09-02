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

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TrackType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
	IsArray,
	IsBoolean,
	IsDate,
	IsDefined,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsPositive,
	IsString,
	Matches,
} from "class-validator";

/**
 * Extracted metadata from a track file
 */
export default class Metadata {
	/**
	 * If the track is from a compilation album
	 */
	@ApiProperty()
	@IsBoolean()
	@Transform(({ value }) => value === "true")
	@IsDefined()
	compilation: boolean;

	/**
	 * Name of the artist of the track
	 */
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	@ApiProperty()
	artist: string;

	@ApiPropertyOptional()
	@IsArray()
	@IsOptional()
	@IsString({ each: true })
	featuring?: string[];

	/**
	 * Name of the artist of the parent album
	 */
	@ApiPropertyOptional()
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	albumArtist?: string;

	/**
	 * Name of the album of the track
	 */
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	album: string;

	/**
	 * Name of the release of the track
	 */
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	release: string;

	/**
	 * Name of the track
	 */
	@ApiProperty()
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	name: string;

	/**
	 * Release date of the track
	 */
	@ApiPropertyOptional()
	@IsDefined()
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	releaseDate?: Date;

	/**
	 * Index of the track on the disc
	 */
	@ApiPropertyOptional()
	@IsPositive()
	@IsNumber()
	@IsOptional()
	index?: number;

	/**
	 * Index of the disc the track is on
	 */
	@ApiPropertyOptional()
	@IsPositive()
	@IsNumber()
	@IsOptional()
	discIndex?: number;

	/**
	 * Bitrate of the file
	 */
	@ApiPropertyOptional()
	@IsPositive()
	@IsNumber()
	@IsOptional()
	bitrate?: number;

	/**
	 * Duration in seconds of the track
	 */
	@ApiPropertyOptional()
	@IsPositive()
	@IsNumber()
	@IsOptional()
	duration?: number;

	/**
	 * Type of the track
	 */
	@ApiProperty()
	@IsEnum(TrackType)
	@IsDefined()
	type: TrackType;

	/**
	 * Genres of the track
	 */
	@ApiPropertyOptional()
	@IsString({ each: true })
	@IsOptional()
	@IsArray()
	genres?: string[];

	/**
	 * Discogs ID of the parent release
	 */
	@ApiProperty()
	@IsString()
	@Matches(/^\d+$/, {
		message: "Discogs IDs should be at least one digit long",
	})
	@IsOptional()
	discogsId?: string;
}
