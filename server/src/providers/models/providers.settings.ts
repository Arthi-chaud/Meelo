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

import { IsOptional, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import GeniusSettings from "../genius/genius.settings";
import MusicBrainzSettings from "../musicbrainz/musicbrainz.settings";
import DiscogsSettings from "../discogs/discogs.settings";
import WikipediaSettings from "../wikipedia/wikipedia.settings";
import MetacriticSettings from "../metacritic/metacritic.settings";
import AllMusicSettings from "../allmusic/allmusic.settings";

/**
 * Settings for the Providers
 */
export default class ProvidersSettings {
	/**
	 * Settings for the Genius provider
	 */
	@ApiProperty({
		type: GeniusSettings,
		required: false,
	})
	@Type(() => GeniusSettings)
	@ValidateNested()
	@IsOptional()
	genius: GeniusSettings;

	/**
	 * Settings for the Musicbrainz provider
	 */
	@ApiProperty({
		type: MusicBrainzSettings,
		required: false,
	})
	@Type(() => MusicBrainzSettings)
	@ValidateNested()
	@IsOptional()
	musicbrainz: MusicBrainzSettings;

	/**
	 * Settings for the Discogs provider
	 */
	@ApiProperty({
		type: DiscogsSettings,
		required: false,
	})
	@Type(() => DiscogsSettings)
	@ValidateNested()
	@IsOptional()
	discogs: DiscogsSettings;

	/**
	 * Settings for the Wikipedia provider
	 */
	@ApiProperty({
		type: WikipediaSettings,
		required: false,
	})
	@Type(() => WikipediaSettings)
	@ValidateNested()
	@IsOptional()
	wikipedia: WikipediaSettings;

	/**
	 * Settings for the Metacritic provider
	 */
	@ApiProperty({
		type: MetacriticSettings,
		required: false,
	})
	@Type(() => MetacriticSettings)
	@ValidateNested()
	@IsOptional()
	metacritic: MetacriticSettings;

	/**
	 * Settings for the AllMusic provider
	 */
	@ApiProperty({
		type: AllMusicSettings,
		required: false,
	})
	@Type(() => AllMusicSettings)
	@ValidateNested()
	@IsOptional()
	allMusic: AllMusicSettings;
}
