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

import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Exclude, Type } from "class-transformer";
import {
	ArrayNotEmpty,
	IsBoolean,
	IsDefined,
	IsIn,
	IsNotEmpty,
	IsOptional,
	IsString,
	ValidateNested,
} from "class-validator";

export const metadataSourceValue = ["path", "embedded"] as const;
export const metadataOrderValue = ["only", "preferred"] as const;

class BaseProviderSettings {
	@ApiProperty()
	@IsOptional()
	@IsBoolean()
	@ApiProperty({ type: Boolean })
	enabled = true;
}

//TODO Delete Provider Settings after Matcher Microservice

class AllMusicSettings extends BaseProviderSettings {}

class DiscogsSettings extends BaseProviderSettings {
	@ApiHideProperty()
	@IsDefined()
	@IsString()
	@Exclude({ toPlainOnly: true })
	apiKey: string;
}

class GeniusSettings extends BaseProviderSettings {
	@ApiHideProperty()
	@IsDefined()
	@IsString()
	@Exclude({ toPlainOnly: true })
	apiKey: string;
}
class MetacriticSettings extends BaseProviderSettings {}

class MusicBrainzSettings extends BaseProviderSettings {}

class WikipediaSettings extends BaseProviderSettings {}

/**
 * Settings for the Providers
 */
export class ProvidersSettings {
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

class CompilationSettings {
	@ApiProperty()
	@IsNotEmpty({ each: true })
	@IsString({ each: true })
	@IsOptional()
	artists?: string[];

	@ApiProperty()
	@IsDefined()
	@IsBoolean()
	useID3CompTag: boolean;
}

class MetadataSettings {
	/**
	 * Use the path or the embedded metadata as main metadata source
	 */
	@ApiProperty({ enum: metadataSourceValue })
	@IsIn(metadataSourceValue)
	source: typeof metadataSourceValue[number];

	/**
	 * Exclude the other source, or use is as a fallback
	 */
	@ApiProperty({ enum: metadataOrderValue })
	@IsIn(metadataOrderValue)
	order: typeof metadataOrderValue[number];

	/**
	 * Enable the use of genres from (enabled) external providers
	 */
	@ApiProperty()
	@IsBoolean()
	useExternalProviderGenres: boolean;
}
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

	/**
	 * Array of RegExp string, used to match track files
	 */
	@ApiProperty()
	@IsString({ each: true })
	@ArrayNotEmpty()
	trackRegex: string[];

	/**
	 * Defines the metadata parsing policy
	 */
	@ApiProperty({
		type: MetadataSettings,
	})
	@Type(() => MetadataSettings)
	@ValidateNested()
	@IsDefined()
	metadata: MetadataSettings;

	/**
	 * Settings for the providers
	 */
	@ApiProperty({
		type: ProvidersSettings,
	})
	@Type(() => ProvidersSettings)
	@ValidateNested()
	@IsDefined()
	providers: ProvidersSettings;

	@ApiProperty({
		type: CompilationSettings,
	})
	@Type(() => CompilationSettings)
	@ValidateNested()
	@IsDefined()
	compilations: CompilationSettings;
}
