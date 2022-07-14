import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import InvalidIdParsingInput from './id.exceptions';
@Injectable()
export class ParseIdPipe implements PipeTransform<string> {
	transform(value: string, _metadata: ArgumentMetadata): number {
		console.log(value);
		let parsedId: number = parseInt(value);
		if (isNaN(parsedId)) {
			throw new InvalidIdParsingInput(value);
		}
		return parsedId;
	}
}
