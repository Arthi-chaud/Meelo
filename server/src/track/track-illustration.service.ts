import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import RepositoryIllustrationService from "src/repository/repository-illustration.service";
import TrackQueryParameters from "./models/track.query-parameters";
import FileManagerService from "src/file-manager/file-manager.service";
import Slug from "src/slug/slug";
import ReleaseIllustrationService from "src/release/release-illustration.service";
import TrackService from "./track.service";
import Identifier from "src/identifier/models/identifier";

type ServiceArgs = [
	albumArtistSlug: Slug | undefined,
	albumSlug: Slug,
	releaseSlug: Slug,
	discIndex?: number,
	trackIndex?: number
];

@Injectable()
export default class TrackIllustrationService extends RepositoryIllustrationService<
	ServiceArgs,
	TrackQueryParameters.WhereInput
>{
	constructor(
		fileManagerService: FileManagerService,
		@Inject(forwardRef(() => ReleaseIllustrationService))
		private releaseIllustrationService: ReleaseIllustrationService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService
	) {
		super(fileManagerService);
	}

	buildIllustrationFolderPath(...args: ServiceArgs): string {
		const [
			_albumArtistSlug,
			_albumSlug,
			_releaseSlug,
			_discIndex,
			trackIndex
		] = args;

		return `${this.buildDiscIllustrationFolderPath(...args)}track-${trackIndex ?? 0 }`;
	}

	buildDiscIllustrationFolderPath(...args: ServiceArgs): string {
		const [
			albumArtistSlug,
			albumSlug,
			releaseSlug,
			discIndex,
		] = args;
		const releaseIllustrationFolder = this.releaseIllustrationService
			.buildIllustrationFolderPath(
				albumArtistSlug,
				albumSlug,
				releaseSlug,
			);

		return `${releaseIllustrationFolder}/${discIndex ? `disc-${discIndex}/` : ''}`;
	}

	buildDiscIllustrationPath(...args: ServiceArgs): string {
		return `${this.buildDiscIllustrationFolderPath(...args)}/cover.jpg`;
	}

	buildIllustrationLink(identifier: Identifier): string {
		return `${this.IllustrationControllerPath}/tracks/${identifier}`;
	}

	async formatWhereInputToIdentifiers(
		where: TrackQueryParameters.WhereInput
	): Promise<ServiceArgs> {
		return this.trackService.get(where).then(async (track) => {
			const releaseIdentfiers = await this.releaseIllustrationService
				.formatWhereInputToIdentifiers({ id: track.releaseId });

			return [
				...releaseIdentfiers,
				track.discIndex ?? undefined,
				track.trackIndex ?? undefined
			];
		});
	}
}
