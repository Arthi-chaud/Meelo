import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';
import { InvalidRequestException } from 'src/exceptions/meelo-exception';
@Injectable()
export class ParseIdPipe implements PipeTransform<string> {
	transform(value: string, _metadata: ArgumentMetadata): number {
		let parsedId: number = parseInt(value);
		if (isNaN(parsedId)) {
			throw new InvalidRequestException(value);
		}
		return parsedId;
	}
}
