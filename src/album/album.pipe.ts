import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { ParseIdPipe } from "src/identifier/id.pipe";
import { SlugSeparator } from "src/identifier/identifier.slug-separator";
import Slug from "src/slug/slug";
import type AlbumQueryParameters from "./models/album.query-parameters";

export default class ParseAlbumIdentifierPipe implements PipeTransform {
	transform<T extends { idOrSlug: string; }>(value: T, _metadata: ArgumentMetadata): AlbumQueryParameters.WhereInput {
		try {
			return { byId: { id: new ParseIdPipe().transform(value.idOrSlug, _metadata) }};
		} catch {
			const slugs = value.idOrSlug.split(SlugSeparator);
			if (slugs.length != 2)
				throw new InvalidRequestException(`Expected the following string format: 'artist-slug${SlugSeparator}album-slug'`);
			return {
				bySlug: {
					slug: new Slug(slugs[1]),
					artist: {
						slug: new Slug(slugs[0]),
					}
				}
			}
		}
	}
};