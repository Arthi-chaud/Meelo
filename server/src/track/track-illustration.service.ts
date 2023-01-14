import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import RepositoryIllustrationService from "src/repository/repository-illustration.service";
import TrackQueryParameters from "./models/track.query-parameters";
import FileManagerService from "src/file-manager/file-manager.service";
import Slug from "src/slug/slug";
import ReleaseIllustrationService from "src/release/release-illustration.service";
import TrackService from "./track.service";

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
		private releaseIllustrationService: ReleaseIllustrationService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService
	) {
		super(fileManagerService);
	}

	buildIllustrationFolderPath(...args: ServiceArgs): string {
		const [
			albumArtistSlug,
			albumSlug,
			releaseSlug,
			discIndex,
			trackIndex
		] = args;
		const releaseIllustrationFolder = this.releaseIllustrationService
			.buildIllustrationFolderPath(
				albumArtistSlug,
				albumSlug,
				releaseSlug,
			);

		return `${releaseIllustrationFolder}/${discIndex ? `disc-${discIndex}-` : ''}track-${trackIndex ?? 0 }`;
	}

	async getIllustrationLink(where: TrackQueryParameters.WhereInput): Promise<string | null> {
		const track = await this.trackService.get(where);
		const identifiers = await this.formatWhereInputToIdentifiers(where);
		const trackIllustrationPath = this.buildIllustrationPath(...identifiers);

		if (this.illustrationExists(trackIllustrationPath)) {
			return `/illustrations/tracks/${track.id}`;
		}
		return this.releaseIllustrationService.getIllustrationLink({ id: track.releaseId });
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