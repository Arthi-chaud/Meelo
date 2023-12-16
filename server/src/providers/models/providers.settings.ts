import { IsOptional, ValidateNested } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import GeniusSettings from "../genius/genius.settings";
import MusicBrainzSettings from "../musicbrainz/musicbrainz.settings";
import DiscogsSettings from "../discogs/discogs.settings";
import WikipediaSettings from "../wikipedia/wikipedia.settings";
import MetacriticSettings from "../metacritic/metacritic.settings";
import AllMusicSettings from "../allmusic/allmusic.settings";

/**
 * Settings for the Providers
 */
export default class ProvidersSettings {
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
