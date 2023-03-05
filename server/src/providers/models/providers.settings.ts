import { IsOptional, ValidateNested } from "class-validator";
import MusixMatchSettings from "../musixmatch/musixmatch.settings";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import GeniusSettings from "../genius/genius.settings";

/**
 * Settings for the Providers
 */
export default class ProvidersSettings {
	/**
	 * Settings for the MusixMatch provider
	 */
	@ApiProperty({
		type: MusixMatchSettings,
		required: false
	})
	@Type(() => MusixMatchSettings)
	@ValidateNested()
	@IsOptional()
	musixmatch: MusixMatchSettings;

	/**
	 * Settings for the Genius provider
	 */
	@ApiProperty({
		type: GeniusSettings,
		required: false
	})
	@Type(() => GeniusSettings)
	@ValidateNested()
	@IsOptional()
	genius: GeniusSettings;
}