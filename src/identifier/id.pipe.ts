import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import InvalidIdParsingInput from './id.exceptions';
@Injectable()
export class ParseIdPipe implements PipeTransform<string> {
	transform(value: string, _metadata: ArgumentMetadata): number {
		if (value.match('[1-9]([0-9]+)?$') === null) {
			throw new InvalidIdParsingInput(value);
		}
		return parseInt(value);
	}
}
