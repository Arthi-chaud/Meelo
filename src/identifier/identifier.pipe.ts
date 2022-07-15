import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { ParseIdPipe } from "src/identifier/id.pipe";
import Slug from "src/slug/slug";
import type RequireOnlyOne from "src/utils/require-only-one";

export default class ParseResourceIdentifierPipe<W extends RequireOnlyOne<{ id: number, slug: Slug}>> implements PipeTransform {
	transform<T extends { id: any }>(value: T, _metadata: ArgumentMetadata): W {
		try {
			const id = new ParseIdPipe().transform(value.id, _metadata);
			return <W>{ id: id };
		} catch {
			return <W>{ slug: new Slug(value.id) };
		}
	}
	
}