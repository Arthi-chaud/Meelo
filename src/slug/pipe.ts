import {
	ArgumentMetadata, Injectable, PipeTransform
} from '@nestjs/common';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import Slug from './slug';

@Injectable()
export class ParseSlugPipe implements PipeTransform {
	transform(value: any, _metadata: ArgumentMetadata): Slug {
		return new Slug(value);
	}
}

/**
 * Parses an artist's slug
 * If the slug equals `compilationAlbumArtistKeyword`, returns 'undefined',
 * as it is the value used to refer to compilation albums pseudo-artist
 */
@Injectable()
export class ParseArtistSlugPipe implements PipeTransform {
	transform(value: any, _metadata: ArgumentMetadata): Slug | undefined {
		const slug = new Slug(value);

		if (slug.toString() === compilationAlbumArtistKeyword) {
			return undefined;
		}
		return slug;
	}
}
