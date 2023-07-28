import { SongType } from "@prisma/client";
import { Release, Track, Artist, Album, SongWithRelations, Playlist } from "src/prisma/models";

export const expectedArtistResponse = (artist: Artist) => ({
	...artist,
	registeredAt: artist.registeredAt.toISOString(),
	illustration: null,
});

export const expectedAlbumResponse = (album: Album) => ({
	...album,
	registeredAt: album.registeredAt.toISOString(),
	releaseDate: album.releaseDate?.toISOString() ?? null,
	illustration: null,
});

export const expectedSongResponse = (song: SongWithRelations) => ({
	...song,
	registeredAt: song.registeredAt.toISOString(),
	type: SongType.Original,
	illustration: null,
});

export const expectedReleaseResponse = (release: Release) => ({
	...release,
	registeredAt: release.registeredAt.toISOString(),
	releaseDate: release.releaseDate?.toISOString() ?? null,
	illustration: null,
});

export const expectedTrackResponse = (track: Track) => ({
	...track,
	illustration: null,
	stream: `/files/${track.sourceFileId}/stream`
});

export const expectedPlaylistResponse = (playlist: Playlist) => ({
	...playlist,
	createdAt: playlist.createdAt.toISOString(),
	illustration: null,
});

export const expectedPlaylistEntryResponse = (song: SongWithRelations, id: number) => ({
	...expectedSongResponse(song),
	entryId: id
});