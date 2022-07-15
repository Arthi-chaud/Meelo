import type { ArgumentMetadata } from "@nestjs/common";
import ParseBaseIdentifierPipe from "src/identifier/identifier.base-pipe";
import compilationAlbumArtistKeyword from "src/utils/compilation";
import type ArtistQueryParameters from "./models/artist.query-parameters";

class ParseArtistIdentifierPipe extends ParseBaseIdentifierPipe<ArtistQueryParameters.WhereInput> {
	transform<T extends { idOrSlug: any; }>(value: T, _metadata: ArgumentMetadata): ArtistQueryParameters.WhereInput {
		const transformedIdentifier = super.transform(value, _metadata);
		if (transformedIdentifier.slug?.toString() == compilationAlbumArtistKeyword) {
			return { compilationArtist: true };
		}
		return transformedIdentifier;
	}
};
export default ParseArtistIdentifierPipe;