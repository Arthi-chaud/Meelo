import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { ParseIdPipe } from "src/identifier/id.pipe";
import Slug from "src/slug/slug";

export default class ParseBaseIdentifierPipe<W extends Partial<{ id: number, slug: Slug }>> implements PipeTransform {
	transform<T extends { idOrSlug: any }>(value: T, _metadata: ArgumentMetadata): W {
		try {
			const id = new ParseIdPipe().transform(value.idOrSlug, _metadata);
			return <W>{ id: id };
		} catch {
			return <W>{ slug: new Slug(value.idOrSlug) };
		}
	}
	
}