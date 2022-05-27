/**
 * Global settings of the Meelo server
 */
export type Settings = {
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
	 * Use the name of the album in path as the release name (overriding the file's embedded metadat)
	 */
	releaseNameFromPath: boolean
}