import { ArgumentMetadata, ParseIntPipe, PipeTransform } from "@nestjs/common";
import { defaultPageSize, PaginationParameters } from "./models/pagination-parameters";
import InvalidPaginationParameterValue from "./pagination.exceptions";

class ParsePaginationParameterPipe implements PipeTransform {
	async transform(value: Record<keyof PaginationParameters, any>, _metadata: ArgumentMetadata): Promise<PaginationParameters> {
		let parseInt = new ParseIntPipe();
		const skip = value.skip !== undefined ? await parseInt.transform(value.skip, _metadata) : 0;
		const take = value.take !== undefined ? await parseInt.transform(value.take, _metadata) : defaultPageSize;

		if (skip < 0)
			throw new InvalidPaginationParameterValue('skip');
		if (take < 0)
			throw new InvalidPaginationParameterValue('take');
		return {
			skip,
			take 
		}
	}
}

export default ParsePaginationParameterPipe;