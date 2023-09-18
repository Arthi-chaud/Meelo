import { IsOptional, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import GeniusSettings from "../genius/genius.settings";
import MusicBrainzSettings from "../musicbrainz/musicbrainz.settings";
import DiscogsSettings from "../discogs/discogs.settings";

/**
 * Settings for the Providers
 */
export default class ProvidersSettings {
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

	/**
	 * Settings for the Musicbrainz provider
	 */
	@ApiProperty({
		type: MusicBrainzSettings,
		required: false
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
		required: false
	})
	@Type(() => DiscogsSettings)
	@ValidateNested()
	@IsOptional()
	discogs: DiscogsSettings;
}
