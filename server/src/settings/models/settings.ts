import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
	ArrayNotEmpty,
	IsDefined,
	IsIn, IsString, ValidateNested
} from "class-validator";

export const metadataSourceValue = ["path", "embedded"] as const;
export const metadataOrderValue = ["only", "preferred"] as const;

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
}
/**
 * Global settings of the Meelo server
 */
export default class Settings {
	/**
	 * The folder where `settings.json` and metadata are stored
	 */
	@ApiProperty()
	@IsString()
	meeloFolder: string;

	/**
	 * The base folder where every libraries must be located
	 */
	@ApiProperty()
	@IsString()
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
		type: MetadataSettings
	})
	@Type(() => MetadataSettings)
	@ValidateNested()
	@IsDefined()
	metadata: MetadataSettings;
}
