import { ApiProperty } from "@nestjs/swagger";

export const metadataSourceValue = ["path", "embedded"] as const;
export const metadataOrderValue = ["only", "preferred"] as const;

class MetadataSettings {
	/**
	 * Use the path or the embedded metadata as main metadata source
	 */
	@ApiProperty({ enum: metadataSourceValue })
	source: typeof metadataSourceValue[number];

	/**
	 * Exclude the other source, or use is as a fallback
	 */
	@ApiProperty({ enum: metadataOrderValue })
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
	meeloFolder: string;

	/**
	 * The base folder where every libraries must be located
	 */
	@ApiProperty()
	dataFolder: string;

	/**
	 * Array of RegExp string, used to match track files
	 */
	@ApiProperty()
	trackRegex: string[];

	/**
	 * Defines the metadata parsing policy
	 */
	@ApiProperty({
		type: MetadataSettings
	})
	metadata: MetadataSettings;
}
