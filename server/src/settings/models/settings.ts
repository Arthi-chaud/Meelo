import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
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
import ProvidersSettings from "src/providers/models/providers.settings";

export const metadataSourceValue = ["path", "embedded"] as const;
export const metadataOrderValue = ["only", "preferred"] as const;

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
	source: (typeof metadataSourceValue)[number];

	/**
	 * Exclude the other source, or use is as a fallback
	 */
	@ApiProperty({ enum: metadataOrderValue })
	@IsIn(metadataOrderValue)
	order: (typeof metadataOrderValue)[number];

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
