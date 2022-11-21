import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { ParseIdPipe } from "src/identifier/id.pipe";
import ParseMultipleSlugPipe from "src/identifier/identifier.parse-slugs";
import { SlugSeparator } from "src/identifier/identifier.slug-separator";
import compilationAlbumArtistKeyword from "src/utils/compilation";
import type AlbumQueryParameters from "./models/album.query-parameters";

export default class ParseAlbumIdentifierPipe implements PipeTransform {
	transform(value: string, _metadata: ArgumentMetadata): AlbumQueryParameters.WhereInput {
		try {
			return { byId: { id: new ParseIdPipe().transform(value, _metadata) } };
		} catch {
			const slugs = new ParseMultipleSlugPipe().transform(value, _metadata);

			if (slugs.length != 2) {
				throw new InvalidRequestException(`Expected the following string format: 'artist-slug${SlugSeparator}album-slug'`);
			}
			return {
				bySlug: {
					slug: slugs[1],
					artist: slugs[0].toString() == compilationAlbumArtistKeyword
						? undefined
						: {	slug: slugs[0] }
				}
			};
		}
	}
}
