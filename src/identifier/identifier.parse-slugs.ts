import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import Slug from "src/slug/slug";
import { SlugSeparator } from "./identifier.slug-separator";

export default class ParseMultipleSlugPipe implements PipeTransform {
	transform(value: any, _metadata: ArgumentMetadata): Slug[] {
		const slugs = value.split(SlugSeparator).map((slugString: string) => new Slug(slugString));
		return slugs;
	}
};