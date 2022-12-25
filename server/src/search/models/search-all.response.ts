import { ApiProperty } from "@nestjs/swagger";
import { AlbumResponse } from "src/album/models/album.response";
import { ArtistResponse } from "src/artist/models/artist.response";
import { GenreResponse } from "src/genre/models/genre.response";
import { ReleaseResponse } from "src/release/models/release.response";
import { SongResponse } from "src/song/models/song.response";

export class SearchAllResponse {
	@ApiProperty({
		isArray: true,
		type: () => ArtistResponse
	})
	artists: ArtistResponse[];

	@ApiProperty({
		isArray: true,
		type: () => AlbumResponse
	})
	albums: AlbumResponse[];

	@ApiProperty({
		isArray: true,
		type: () => ReleaseResponse
	})
	releases: ReleaseResponse[];

	@ApiProperty({
		isArray: true,
		type: () => SongResponse
	})
	songs: SongResponse[];

	@ApiProperty({
		isArray: true,
		type: () => GenreResponse
	})
	genres: GenreResponse[];
}
