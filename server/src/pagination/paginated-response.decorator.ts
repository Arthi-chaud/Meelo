import { Type, applyDecorators } from "@nestjs/common";
import {
	ApiExtraModels, ApiOkResponse, getSchemaPath
} from "@nestjs/swagger";
import PaginatedResponse from "./models/paginated-response";

export const ApiPaginatedResponse = <DataDto extends Type<unknown>>(dataDto: DataDto) =>
	applyDecorators(
		ApiExtraModels(PaginatedResponse, dataDto),
		ApiOkResponse({
			schema: {
				allOf: [
					{ $ref: getSchemaPath(PaginatedResponse) },
					{
						properties: {
							items: {
								type: 'array',
								items: { $ref: getSchemaPath(dataDto) },
							},
						},
					},
				],
			},
		})
	);
