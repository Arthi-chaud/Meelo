import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import RepositoryIllustrationService from "src/repository/repository-illustration.service";
import SongQueryParameters from "./models/song.query-params";
import FileManagerService from "src/file-manager/file-manager.service";
import TrackIllustrationService from "src/track/track-illustration.service";
import { IllustrationPath } from "src/illustration/models/illustration-path.model";
import TrackService from "src/track/track.service";
import { InvalidRequestException } from "src/exceptions/meelo-exception";
import { MasterTrackNotFoundException } from "src/track/track.exceptions";

@Injectable()
export default class SongIllustrationService extends RepositoryIllustrationService<
	[never],
	SongQueryParameters.WhereInput
> {
	constructor(
		fileManagerService: FileManagerService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private trackIllustrationService: TrackIllustrationService
	) {
		super(fileManagerService);
	}

	buildIllustrationFolderPath(): IllustrationPath {
		throw new InvalidRequestException('SongIllustrationService.buildIllustrationFolderPath: This method should not be called');
	}

	async getIllustrationLink(where: SongQueryParameters.WhereInput): Promise<string | null> {
		try {
			const master = await this.trackService.getMasterTrack(where);

			return this.trackIllustrationService.getIllustrationLink(master);
		} catch (error) {
			if (error instanceof MasterTrackNotFoundException) {
				return null;
			}
			throw error;
		}
	}

	formatWhereInputToIdentifiers(_where: SongQueryParameters.WhereInput): never {
		throw new InvalidRequestException('SongIllustrationService.formatWhereInputToIdentifiers: This method should not be called');
	}
}