import type { PipeTransform, ArgumentMetadata } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { ParseIdPipe } from "src/identifier/id.pipe";
import ParseMultipleSlugPipe from "src/identifier/identifier.parse-slugs";
import { SlugSeparator } from "src/identifier/identifier.slug-separator";
import type SongQueryParameters from "./models/song.query-params";

export default class ParseSongIdentifierPipe implements PipeTransform {
	transform<T extends { idOrSlug: string; }>(value: T, _metadata: ArgumentMetadata): SongQueryParameters.WhereInput {
		try {
			return { byId: { id: new ParseIdPipe().transform(value.idOrSlug, _metadata) }};
		} catch {
			const slugs = new ParseMultipleSlugPipe().transform(value.idOrSlug, _metadata);
			if (slugs.length != 2)
				throw new InvalidRequestException(`Expected the following string format: 'artist-slug${SlugSeparator}song-slug'`);
			return {
				bySlug: {
					slug: slugs[1],
					artist: {
						slug: slugs[0],
					}
				}
			}
		}
	}
}