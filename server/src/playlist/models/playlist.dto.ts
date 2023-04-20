import { ApiProperty, PickType } from "@nestjs/swagger";
import { IsNumber, IsPositive } from "class-validator";
import { CreatePlaylist } from "src/prisma/models";

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

export class ReorderPlaylistDTO {
	@ApiProperty({
		description: "The IDs of the playlist's entries, ordered"
	})
	@IsPositive({ each: true })
	entryIds: number[];
}
