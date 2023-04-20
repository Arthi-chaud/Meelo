import { Release, Track, Artist, Album, SongWithRelations, Playlist } from "src/prisma/models";

export const expectedArtistResponse = (artist: Artist) => ({
	...artist,
	registeredAt: artist.registeredAt.toISOString(),
	illustration: `/illustrations/artists/${artist.id}`
});

export const expectedAlbumResponse = (album: Album) => ({
	...album,
	registeredAt: album.registeredAt.toISOString(),
	releaseDate: album.releaseDate?.toISOString() ?? null,
	illustration: `/illustrations/albums/${album.id}`
});

export const expectedSongResponse = (song: SongWithRelations) => ({
	...song,
	registeredAt: song.registeredAt.toISOString(),
	illustration: `/illustrations/songs/${song.id}`
});

export const expectedReleaseResponse = (release: Release) => ({
	...release,
	registeredAt: release.registeredAt.toISOString(),
	releaseDate: release.releaseDate?.toISOString() ?? null,
	illustration: `/illustrations/releases/${release.id}`
});

export const expectedTrackResponse = (track: Track) => ({
	...track,
	illustration: `/illustrations/tracks/${track.id}`,
	stream: `/files/${track.sourceFileId}/stream`
});

export const expectedPlaylistResponse = (playlist: Playlist) => ({
	...playlist,
	createdAt: playlist.createdAt.toISOString(),
	illustration: `/illustrations/playlists/${playlist.slug}`
});

export const expectedPlaylistEntryResponse = (song: SongWithRelations, id: number) => ({
	...expectedSongResponse(song),
	entryId: id
});