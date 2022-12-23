import {
	Controller, Get, Req, Response
} from "@nestjs/common";
import type { File } from "src/prisma/models";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import { IdentifierParam } from "src/identifier/identifier-param.decorator";
import Identifier from "src/identifier/models/identifier";

@ApiTags("Files")
@Controller('files')
export default class FileController {
	constructor(
		private fileService: FileService
	) {}

	@ApiOperation({
		summary: 'Get one \'File\''
	})
	@Get(':idOrSlug')
	get(
		@IdentifierParam()
		identifier: Identifier,
		@RelationIncludeQuery(FileQueryParameters.AvailableAtomicIncludes)
		include: FileQueryParameters.RelationInclude,
	): Promise<File> {
		return this.fileService.get(
			FileService.formatIdentifierToWhereInput(identifier),
			include
		);
	}

	@ApiOperation({
		summary: "Get one File's content"
	})
	@Get(':idOrSlug/stream')
	async streamFile(
		@IdentifierParam()
		identifier: Identifier,
		@Response({ passthrough: true }) res: Response,
		@Req() req: any
	) {
		return this.fileService.streamFile(
			FileService.formatIdentifierToWhereInput(identifier),
			res,
			req
		);
	}
}
