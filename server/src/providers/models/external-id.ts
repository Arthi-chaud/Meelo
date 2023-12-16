import {
	AlbumExternalId,
	ArtistExternalId,
	ReleaseExternalId,
	SongExternalId,
} from "src/prisma/models";

type ExternalId =
	| ArtistExternalId
	| AlbumExternalId
	| SongExternalId
	| ReleaseExternalId;

export default ExternalId;
