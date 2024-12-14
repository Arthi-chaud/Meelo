import { File, SongType } from "@prisma/client";
import {
	Release,
	Track,
	Artist,
	Album,
	SongWithRelations,
	Playlist,
} from "src/prisma/models";

export const expectedArtistResponse = (artist: Artist) => ({
	...artist,
	registeredAt: artist.registeredAt.toISOString(),
});

export const expectedFileResponse = (file: File) => ({
	...file,
	registerDate: file.registerDate.toISOString(),
});

export const expectedAlbumResponse = (album: Album) => ({
	...album,
	registeredAt: album.registeredAt.toISOString(),
	releaseDate: album.releaseDate?.toISOString() ?? null,
});

export const expectedSongResponse = (song: SongWithRelations) => ({
	...song,
	registeredAt: song.registeredAt.toISOString(),
	type: SongType.Original,
});

export const expectedSongGroupResponse = (
	song: SongWithRelations,
	versionCount: number,
) => ({
	...expectedSongResponse(song),
	id: song.groupId,
	songId: song.id,
	versionCount,
});

export const expectedReleaseResponse = (release: Release) => ({
	...release,
	registeredAt: release.registeredAt.toISOString(),
	releaseDate: release.releaseDate?.toISOString() ?? null,
});

export const expectedTrackResponse = (track: Track) => ({
	...track,
});

export const expectedPlaylistResponse = (playlist: Playlist) => ({
	...playlist,
	createdAt: playlist.createdAt.toISOString(),
});

export const expectedPlaylistEntryResponse = (
	song: SongWithRelations,
	index: number,
	id: number,
) => ({
	...expectedSongResponse(song),
	index,
	entryId: id,
});
