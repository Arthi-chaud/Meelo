import { applyDecorators } from "@nestjs/common";
import {
	ApiExtraModels, ApiOkResponse, getSchemaPath
} from "@nestjs/swagger";
import PaginatedResponse from "./models/paginated-response";

export const ApiPaginatedResponse = <DataDto extends Parameters<typeof getSchemaPath>[0]>(dataDto: DataDto) =>
	applyDecorators(
		ApiExtraModels(PaginatedResponse, dataDto as any),
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
