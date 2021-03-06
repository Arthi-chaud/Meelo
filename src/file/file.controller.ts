import { Get, Param, Controller, Query, Response } from "@nestjs/common";
import type { File } from "@prisma/client";
import { ParseIdPipe } from "src/identifier/id.pipe";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import { ApiOperation, ApiTags } from '@nestjs/swagger';

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
	getFile(
		@Param('id', ParseIdPipe)
		fileId: number,
		@Query('with', FileQueryParameters.ParseRelationIncludePipe)
		include: FileQueryParameters.RelationInclude,
	): Promise<File> {
		return this.fileService.getFile({ id: fileId }, include);
	}

	@ApiOperation({
		summary: 'Get one \'File\'\'s content'
	})
	@Get(':id/stream')
	async streamFile(
		@Param('id', ParseIdPipe)
		fileId: number,
		@Response({ passthrough: true })
		res: Response
	) {
		const file = await this.fileService.getFile({ id: fileId }, { library: true });
		return this.fileService.streamFile(file, file.library, res);
	}
}