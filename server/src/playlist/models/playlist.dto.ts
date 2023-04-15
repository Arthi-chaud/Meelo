import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNumber } from "class-validator";
import { CreatePlaylist, CreatePlaylistEntry } from "src/prisma/models";

export class CreatePlaylistDTO extends PickType(CreatePlaylist, ['name']) {}

export class UpdatePlaylistDTO extends PickType(CreatePlaylist, ['name']) {}

export class CreatePlaylistEntryDTO {
	@ApiProperty({
		description: "The ID of the playlist to add the song to"
	})
	@IsNumber()
	playlistId: number;

	@ApiProperty({
		description: "The ID of the song"
	})
	@IsNumber()
	songId: number;
}

export class UpdatePlaylistEntryDTO extends PickType(CreatePlaylistEntry, ['index']) {}
