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
import { Exclude } from "class-transformer";
import { IsBoolean, IsString } from "class-validator";

export const metadataSourceValue = ["path", "embedded"] as const;
export const metadataOrderValue = ["only", "preferred"] as const;

/**
 * Global settings of the Meelo server
 */
export default class Settings {
	/**
	 * If true, endpoints with base access control will allow unauth-ed requests
	 */
	@ApiProperty()
	@IsBoolean()
	allowAnonymous: boolean;
	/**
	 * The folder where `settings.json` and metadata are stored
	 */
	@ApiProperty()
	@IsString()
	@Exclude({ toPlainOnly: true })
	meeloFolder: string;

	/**
	 * The base folder where every libraries must be located
	 */
	@ApiProperty()
	@IsString()
	@Exclude({ toPlainOnly: true })
	dataFolder: string;
}
