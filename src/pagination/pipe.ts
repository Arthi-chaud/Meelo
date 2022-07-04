import { ArgumentMetadata, BadRequestException, PipeTransform } from "@nestjs/common";
import type { PaginationParameters } from "src/pagination/parameters";

class ParsePaginationParameterPipe implements PipeTransform {
	transform(value: Record<keyof PaginationParameters, any>, _metadata: ArgumentMetadata): PaginationParameters {
		const skip = value.skip !== undefined ? parseInt(value.skip) : 0;
		const take = value.take !== undefined ? parseInt(value.take) : 50;
		if (skip === NaN || skip < 0)
			throw new BadRequestException("Invalid 'skip' parameter, expected positive integer");
		if (take === NaN || take < 0)
			throw new BadRequestException("Invalid 'take' parameter, expected positive integer");
		let parsedValue: PaginationParameters = {
			skip,
			take 
		}
		return parsedValue;
	}
}

export default ParsePaginationParameterPipe;