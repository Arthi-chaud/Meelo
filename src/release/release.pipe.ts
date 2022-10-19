import type { PipeTransform, ArgumentMetadata } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { ParseIdPipe } from "src/identifier/id.pipe";
import ParseMultipleSlugPipe from "src/identifier/identifier.parse-slugs";
import { SlugSeparator } from "src/identifier/identifier.slug-separator";
import compilationAlbumArtistKeyword from "src/utils/compilation";
import type ReleaseQueryParameters from "./models/release.query-parameters";

export default class ParseReleaseIdentifierPipe implements PipeTransform {
	transform(value: string, _metadata: ArgumentMetadata): ReleaseQueryParameters.WhereInput {
		try {
			return { byId: { id: new ParseIdPipe().transform(value, _metadata) }};
		} catch {
			const slugs = new ParseMultipleSlugPipe().transform(value, _metadata);
			if (slugs.length != 3)
				throw new InvalidRequestException(`Expected the following string format: 'artist-slug${SlugSeparator}album-slug${SlugSeparator}release-slug'`);
			return {
				bySlug: {
					slug: slugs[2],
					album: {
						bySlug: {
							slug: slugs[1],
							artist: slugs[0].toString() == compilationAlbumArtistKeyword
								? undefined
								: { slug: slugs[0] }
						}
					}
				}
			}
		}
	}
}