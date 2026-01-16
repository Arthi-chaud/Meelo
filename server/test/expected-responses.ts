import { type File, SongType, VideoType } from "src/prisma/generated/client";
import type {
	Album,
	Artist,
	Playlist,
	Release,
	SongWithRelations,
	Track,
	VideoWithRelations,
} from "src/prisma/models";

export const expectedArtistResponse = ({ sortSlug, ...artist }: Artist) => ({
	...artist,
	registeredAt: artist.registeredAt.toISOString(),
});

export const expectedFileResponse = (file: File) => ({
	...file,
	registerDate: file.registerDate.toISOString(),
});

export const expectedAlbumResponse = ({
	sortSlug,
	nameSlug,
	...album
}: Album) => ({
	...album,
	registeredAt: album.registeredAt.toISOString(),
	releaseDate: album.releaseDate?.toISOString() ?? null,
});

export const expectedSongResponse = ({
	nameSlug,
	sortSlug,
	...song
}: SongWithRelations) => ({
	...song,
	registeredAt: song.registeredAt.toISOString(),
	type: SongType.Original,
});

export const expectedVideoResponse = ({
	sortSlug,
	...video
}: VideoWithRelations) => ({
	...video,
	registeredAt: video.registeredAt.toISOString(),
	type: VideoType.MusicVideo,
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

export const expectedTrackResponse = ({
	thumbnailId,
	standaloneIllustrationId,
	...track
}: Track) => ({
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
