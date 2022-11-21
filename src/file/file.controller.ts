import {
	Controller, Get, Param, Req, Response
} from "@nestjs/common";
import type { File } from "src/prisma/models";
import { ParseIdPipe } from "src/identifier/id.pipe";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";

@ApiTags("Files")
@Controller('files')
export default class FileController {
	constructor(
		private fileService: FileService
	) {}

	@ApiOperation({
		summary: 'Get one \'File\''
	})
	@Get(':id')
	get(
		@Param('id', ParseIdPipe)
		fileId: number,
		@RelationIncludeQuery(FileQueryParameters.AvailableAtomicIncludes)
		include: FileQueryParameters.RelationInclude,
	): Promise<File> {
		return this.fileService.get({ id: fileId }, include);
	}

	@ApiOperation({
		summary: 'Get one \'File\'\'s content'
	})
	@Get(':id/stream')
	async streamFile(
		@Param('id', ParseIdPipe)
		fileId: number,
		@Response({ passthrough: true }) res: Response,
		@Req() req: any
	) {
		const file = await this.fileService.get({ id: fileId }, { library: true });

		return this.fileService.streamFile(file, file.library, res, req);
	}
}
