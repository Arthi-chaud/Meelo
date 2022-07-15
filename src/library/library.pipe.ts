import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { ParseIdPipe } from "src/id/id.pipe";
import Slug from "src/slug/slug";
import type LibraryQueryParameters from "./models/library.query-parameters";

export default class ParseLibraryIdentifierPipe<T extends { id: any }> implements PipeTransform<T> {
	transform(value: T, _metadata: ArgumentMetadata): LibraryQueryParameters.WhereInput {
		try {
			const id = new ParseIdPipe().transform(value.id, _metadata);
			return { id: id };
		} catch {
			return { slug: new Slug(value.id) }
		}
	}
	
}