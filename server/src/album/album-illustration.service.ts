import RepositoryIllustrationService from "src/repository/repository-illustration.service";
import AlbumQueryParameters from "./models/album.query-parameters";
import Slug from "src/slug/slug";
import FileManagerService from "src/file-manager/file-manager.service";
import ArtistIllustrationService from "src/artist/artist-illustration.service";
import AlbumService from "./album.service";
import { join } from "path";
import ReleaseService from "src/release/release.service";
import ReleaseIllustrationService from "src/release/release-illustration.service";
import { Inject, forwardRef } from "@nestjs/common";

type ServiceArgs = [artistSlug: Slug | undefined, albumSlug: Slug];

export default class AlbumIllustrationService extends RepositoryIllustrationService<
	ServiceArgs,
	AlbumQueryParameters.WhereInput
> {
	constructor(
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => ReleaseIllustrationService))
		private releaseIllustrationService: ReleaseIllustrationService,
		@Inject(forwardRef(() => ArtistIllustrationService))
		private artistIllustrationService: ArtistIllustrationService,
		fileManagerService: FileManagerService
	) {
		super(fileManagerService);
	}

	buildIllustrationFolderPath(artistSlug: Slug | undefined, albumSlug: Slug): string {
		return join(
			this.artistIllustrationService.buildIllustrationFolderPath(artistSlug),
			albumSlug.toString()
		);
	}

	async getIllustrationLink(where: AlbumQueryParameters.WhereInput): Promise<string | null> {
		return this.releaseService.getMasterRelease(where)
			.then((master) => this.releaseIllustrationService.getIllustrationLink(master));
	}

	async formatWhereInputToIdentifiers(
		where: AlbumQueryParameters.WhereInput
	): Promise<ServiceArgs> {
		return this.albumService
			.get(where, { artist: true })
			.then((album) => {
				const slug = album.artist
					? new Slug(album.artist.slug)
					: undefined;

				return [slug, new Slug(album.slug)];
			});
	}

	reassignIllustrationFolder(albumSlug: Slug, oldArtistSlug?: Slug, newArtistSlug?: Slug) {
		const previousPath = this.buildIllustrationFolderPath(oldArtistSlug, albumSlug);
		const newPath = this.buildIllustrationFolderPath(newArtistSlug, albumSlug);

		if (this.fileManagerService.folderExists(previousPath)) {
			this.fileManagerService.rename(previousPath, newPath);
		}
	}
}
