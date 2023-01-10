import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import RepositoryIllustrationService from "src/repository/repository-illustration.service";
import ReleaseQueryParameters from "./models/release.query-parameters";
import Slug from "src/slug/slug";
import ReleaseService from "./release.service";
import FileManagerService from "src/file-manager/file-manager.service";
import { join } from 'path';
import AlbumIllustrationService from "src/album/album-illustration.service";
import compilationAlbumArtistKeyword from "src/utils/compilation";
import { SlugSeparator } from "src/identifier/identifier.slug-separator";

type ServiceArgs = [artistSlug: Slug | undefined, albumSlug: Slug, releaseSlug: Slug];

@Injectable()
export default class ReleaseIllustrationService extends RepositoryIllustrationService<
	ServiceArgs,
	ReleaseQueryParameters.WhereInput
> {
	constructor(
		@Inject(forwardRef(() => AlbumIllustrationService))
		private albumIllustrationService: AlbumIllustrationService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		fileManagerService: FileManagerService
	) {
		super(fileManagerService);
	}

	buildIllustrationFolderPath(
		artistSlug: Slug | undefined, albumSlug: Slug, releaseSlug: Slug
	): string {
		return join(
			this.albumIllustrationService.buildIllustrationFolderPath(artistSlug, albumSlug),
			releaseSlug.toString()
		);
	}

	async getIllustrationLink(where: ReleaseQueryParameters.WhereInput): Promise<string | null> {
		const identifiers = await this.formatWhereInputToIdentifiers(where);
		const path = await this.getIllustrationPath(where);

		if (this.illustrationExists(path)) {
			const [artistSlug, albumSlug, releaseSlug] = identifiers;

			return '/illustrations/releases/' + [artistSlug ?? new Slug(compilationAlbumArtistKeyword), albumSlug, releaseSlug]
				.map((slug) => slug.toString())
				.join(SlugSeparator);
		}
		return null;
	}

	async formatWhereInputToIdentifiers(
		where: ReleaseQueryParameters.WhereInput
	): Promise<ServiceArgs> {
		return this.releaseService
			.select(where, { slug: true, albumId: true })
			.then(async ({ slug, albumId }) => {
				return this.albumIllustrationService
					.formatWhereInputToIdentifiers({ id: albumId })
					.then((args) => [...args, new Slug(slug)]);
			});
	}

	reassignIllustrationFolder(
		releaseSlug: Slug, oldAlbumSlug: Slug, newAlbumSlug: Slug,
		oldArtistSlug?: Slug, newArtistSlug?: Slug
	) {
		const previousPath = this.buildIllustrationFolderPath(
			oldArtistSlug, oldAlbumSlug, releaseSlug
		);
		const newPath = this.buildIllustrationFolderPath(
			newArtistSlug, newAlbumSlug, releaseSlug
		);

		if (this.fileManagerService.folderExists(previousPath)) {
			this.fileManagerService.rename(previousPath, newPath);
		}
	}
}
