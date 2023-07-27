import { TrackType } from "@prisma/client";
import {
	IsBoolean, IsDate, IsDefined, IsEnum,
	IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString
} from "class-validator";

/**
 * Extracted metadata from a track file
 */
export default class Metadata {
	/**
	 * If the track is from a compilation album
	 */
	@IsBoolean()
	@IsDefined()
	compilation: boolean;

	/**
	 * Name of the artist of the track
	 */
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	artist: string;

	@IsString({ each: true })
	featuring: string[] = [];

	/**
	 * Name of the artist of the parent album
	 */
	@IsString()
	@IsNotEmpty()
	@IsOptional()
	albumArtist?: string;

	/**
	 * Name of the album of the track
	 */
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	album: string;

	/**
	 * Name of the release of the track
	 */
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	release: string;

	/**
	 * Name of the track
	 */
	@IsString()
	@IsNotEmpty()
	@IsDefined()
	name: string;

	/**
	 * Release date of the track
	 */
	@IsDate()
	@IsDefined()
	@IsOptional()
	releaseDate?: Date;

	/**
	 * Index of the track on the disc
	 */
	@IsPositive()
	@IsNumber()
	@IsOptional()
	index?: number;

	/**
	 * Index of the disc the track is on
	 */
	@IsPositive()
	@IsNumber()
	@IsOptional()
	discIndex?: number;

	/**
	 * Bitrate of the file
	 */
	@IsPositive()
	@IsNumber()
	@IsDefined()
	bitrate: number;

	/**
	 * Duration in seconds of the track
	 */
	@IsPositive()
	@IsNumber()
	@IsDefined()
	duration: number;

	/**
	 * Type of the track
	 */
	@IsEnum(TrackType)
	@IsDefined()
	type: TrackType;

	/**
	 * Genres of the track
	 */
	@IsString({ each: true })
	@IsDefined()
	genres: string[];
}
