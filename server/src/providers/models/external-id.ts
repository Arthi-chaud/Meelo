import {
	AlbumExternalId, ArtistExternalId, SongExternalId
} from "src/prisma/models";

type ExternalId = ArtistExternalId | AlbumExternalId | SongExternalId;

export default ExternalId;
