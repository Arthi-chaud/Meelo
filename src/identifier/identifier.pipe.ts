import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import Identifier from './models/identifier';

/**
 * Pipe to turn param into an number, or string on parsing failure
 */
export default class ParseIdentifierPipe implements PipeTransform {
	transform(value: string, _metadata: ArgumentMetadata): Identifier {
		if (isNaN(+value)) {
			return value;
		}
		return parseInt(value);
	}
}
