
export const metadataSourceValue = ["path", "embedded"] as const;
export const metadataOrderValue = ["only", "preferred"] as const;
/**
 * Global settings of the Meelo server
 */
export default interface Settings {
	/**
	 * The base folder where every libraries must be located
	 */
	dataFolder: string;
	/**
	 * Array of RegExp string, used to match track files
	 */
	trackRegex: string[];
	/**
	 * Defines the metadata parsing policy
	 */
	metadata: {
		source: typeof metadataSourceValue[number],
		order: typeof metadataOrderValue[number],
	};
}