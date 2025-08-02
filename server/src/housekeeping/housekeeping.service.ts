/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import AlbumService from "src/album/album.service";
import ArtistService from "src/artist/artist.service";
import GenreService from "src/genre/genre.service";
import LabelService from "src/label/label.service";
import PlaylistService from "src/playlist/playlist.service";
import ReleaseService from "src/release/release.service";
import SongService from "src/song/song.service";
import VideoService from "src/video/video.service";

@Injectable()
export class HousekeepingService {
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => GenreService))
		private genresService: GenreService,

		@Inject(forwardRef(() => VideoService))
		private videoService: VideoService,
		@Inject(forwardRef(() => PlaylistService))
		private playlistService: PlaylistService,
		@Inject(forwardRef(() => LabelService))
		private labelService: LabelService,
	) {}
	/**
	 * Calls housekeeping methods on repository services
	 */
	public async runHousekeeping(): Promise<void> {
		await this.videoService.housekeeping();
		await this.songService.housekeeping();
		await this.releaseService.housekeeping();
		await this.labelService.housekeeping();
		await this.albumService.housekeeping();
		await this.artistService.housekeeping();
		await this.genresService.housekeeping();
		await this.playlistService.housekeeping();
		await this.resolveMasters();
	}

	// Set master items for albums/songs that do not have one
	public async resolveMasters() {
		await this.albumService.resolveMasterReleases();
		await this.songService.resolveMasterTracks();
	}
}
