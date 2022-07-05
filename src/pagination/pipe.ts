import { ArgumentMetadata, BadRequestException, ParseIntPipe, PipeTransform } from "@nestjs/common";
import { defaultPageSize, PaginationParameters } from "src/pagination/parameters";

class ParsePaginationParameterPipe implements PipeTransform {
	async transform(value: Record<keyof PaginationParameters, any>, _metadata: ArgumentMetadata): Promise<PaginationParameters> {
		let parseInt = new ParseIntPipe();
		const skip = value.skip !== undefined ? await parseInt.transform(value.skip, _metadata) : 0;
		const take = value.take !== undefined ? await parseInt.transform(value.take, _metadata) : defaultPageSize;

		if (skip < 0)
			throw new BadRequestException("Invalid 'skip' parameter, expected positive integer");
		if (take < 0)
			throw new BadRequestException("Invalid 'take' parameter, expected positive integer");
		return {
			skip,
			take 
		}
	}
}

export default ParsePaginationParameterPipe;