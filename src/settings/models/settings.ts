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
	 * Use the regexes to match files as a metadata source
	 */
	mergeMetadataWithPathRegexGroup: boolean;
	/**
	 * The URL from which Meelo can be reached from
	 */
	publicURL: string;
}