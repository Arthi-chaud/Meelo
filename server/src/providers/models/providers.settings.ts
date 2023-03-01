import { IsOptional, ValidateNested } from "class-validator";
import MusixMatchSettings from "../musixmatch/musixmatch.settings";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

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
}
