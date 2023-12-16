import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import AlbumService from "src/album/album.service";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import TransformIdentifier from "src/identifier/identifier.transform";
import LibraryService from "src/library/library.service";
import LibraryQueryParameters from "src/library/models/library.query-parameters";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import SongQueryParameters from "src/song/models/song.query-params";
import SongService from "src/song/song.service";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import TrackService from "src/track/track.service";

/**
 * Query Parameter Class/Selector to select files to refresh, using relations
 */
export default class RefreshMetadataSelector {
	@IsOptional()
	@ApiPropertyOptional({
		description: `Refresh based on the library`,
	})
	@TransformIdentifier(LibraryService)
	library?: LibraryQueryParameters.WhereInput;

	// NOTE: Artist is voluntary missing because it does not seem relevant to do it

	@IsOptional()
	@ApiPropertyOptional({
		description: `Refresh based on the album`,
	})
	@TransformIdentifier(AlbumService)
	album?: AlbumQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Refresh based on the release`,
	})
	@TransformIdentifier(ReleaseService)
	release?: ReleaseQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Refresh based on the song`,
	})
	@TransformIdentifier(SongService)
	song?: SongQueryParameters.WhereInput;

	@IsOptional()
	@ApiPropertyOptional({
		description: `Refresh based on the track`,
	})
	@TransformIdentifier(TrackService)
	track?: TrackQueryParameters.WhereInput;
}
