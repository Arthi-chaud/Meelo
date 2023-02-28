import { Injectable } from "@nestjs/common";
import RepositoryIllustrationService from "src/repository/repository-illustration.service";
import SongQueryParameters from "./models/song.query-params";
import FileManagerService from "src/file-manager/file-manager.service";
import { IllustrationPath } from "src/illustration/models/illustration-path.model";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import Identifier from "src/identifier/models/identifier";

@Injectable()
export default class SongIllustrationService extends RepositoryIllustrationService<
	[never],
	SongQueryParameters.WhereInput
> {
	constructor(
		fileManagerService: FileManagerService,
	) {
		super(fileManagerService);
	}

	buildIllustrationFolderPath(): IllustrationPath {
		throw new InvalidRequestException('SongIllustrationService.buildIllustrationFolderPath: This method should not be called');
	}

	buildIllustrationLink(identifier: Identifier): string {
		return `${this.IllustrationControllerPath}/songs/${identifier}`;
	}

	formatWhereInputToIdentifiers(_where: SongQueryParameters.WhereInput): never {
		throw new InvalidRequestException('SongIllustrationService.formatWhereInputToIdentifiers: This method should not be called');
	}
}
