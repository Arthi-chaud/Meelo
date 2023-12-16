import { Controller, Get, Req, Response } from "@nestjs/common";
import type { File } from "src/prisma/models";
import FileService from "./file.service";
import FileQueryParameters from "./models/file.query-parameters";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import RelationIncludeQuery from "src/relation-include/relation-include-query.decorator";
import IdentifierParam from "src/identifier/identifier.pipe";

@ApiTags("Files")
@Controller("files")
export default class FileController {
	constructor(private fileService: FileService) {}

	@ApiOperation({
		summary: "Get one 'File'",
	})
	@Get(":idOrSlug")
	get(
		@RelationIncludeQuery(FileQueryParameters.AvailableAtomicIncludes)
		include: FileQueryParameters.RelationInclude,
		@IdentifierParam(FileService)
		where: FileQueryParameters.WhereInput,
	): Promise<File> {
		return this.fileService.get(where, include);
	}

	@ApiOperation({
		summary: "Get one File's content",
	})
	@Get(":idOrSlug/stream")
	async streamFile(
		@IdentifierParam(FileService)
		where: FileQueryParameters.WhereInput,
		@Response({ passthrough: true }) res: Response,
		@Req() req: any,
	) {
		return this.fileService.streamFile(where, res, req);
	}
}
