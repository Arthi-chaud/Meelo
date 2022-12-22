import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import Slug from "src/slug/slug";
import Identifier from './models/identifier';
import { SlugSeparator } from "./identifier.slug-separator";
import InvalidIdentifierSlugs from "./identifier.exceptions";

export default class ParseMultipleSlugPipe implements PipeTransform {
	transform(value: any, _metadata: ArgumentMetadata): Slug[] {
		const slugs = value.split(SlugSeparator).map((slugString: string) => new Slug(slugString));

		return slugs;
	}
}

/**
 * Parse slugs in an identifier
 * If the obtained array's length does not match `expectedTokens`, throws
 */
export const parseIdentifierSlugs = (identifier: Identifier, expectedTokens?: number) => {
	const slugs = identifier
		.toString()
		.split(SlugSeparator)
		.map((slugString: string) => new Slug(slugString));

	if (expectedTokens != undefined && slugs.length != expectedTokens) {
		throw new InvalidIdentifierSlugs(identifier, expectedTokens, slugs.length);
	}
	return slugs;
};
