import type { ArgumentMetadata, PipeTransform } from "@nestjs/common";
import { PaginationParameters, defaultPageSize } from "./models/pagination-parameters";
import InvalidPaginationParameterValue from "./pagination.exceptions";

class ParsePaginationParameterPipe implements PipeTransform {
	async transform(
		value: Record<keyof PaginationParameters, any>, _metadata: ArgumentMetadata
	): Promise<PaginationParameters> {
		const skip = value.skip !== undefined ? parseInt(value.skip, 10) : 0;
		const take = value.take !== undefined ? parseInt(value.take, 10) : defaultPageSize;

		if (isNaN(skip) || skip < 0) {
			throw new InvalidPaginationParameterValue('skip');
		}
		if (isNaN(take) || take < 0) {
			throw new InvalidPaginationParameterValue('take');
		}
		return { skip, take };
	}
}

export default ParsePaginationParameterPipe;
