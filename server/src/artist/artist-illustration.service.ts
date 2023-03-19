import {
	Inject, Injectable, OnModuleInit, forwardRef
} from '@nestjs/common';
import RepositoryIllustrationService from 'src/repository/repository-illustration.service';
import Slug from 'src/slug/slug';
import ArtistQueryParameters from './models/artist.query-parameters';
import FileManagerService from 'src/file-manager/file-manager.service';
import ArtistService from './artist.service';
import SettingsService from 'src/settings/settings.service';
import { join } from 'path';
import compilationAlbumArtistKeyword from 'src/utils/compilation';
import Identifier from 'src/identifier/models/identifier';
import { OnRepositoryEvent } from 'src/events/event.decorators';
import { Artist } from 'src/prisma/models';
import ProviderService from 'src/providers/provider.service';
import Logger from 'src/logger/logger';
import IllustrationService from 'src/illustration/illustration.service';

type ServiceArgs = [artistSlug?: Slug];

@Injectable()
export default class ArtistIllustrationService extends RepositoryIllustrationService<
	ServiceArgs, ArtistQueryParameters.WhereInput
> implements OnModuleInit {
	private readonly logger = new Logger(ArtistIllustrationService.name);
	private baseIllustrationFolderPath: string;
	constructor(
		private settingsService: SettingsService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		private providerService: ProviderService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		fileManagerService: FileManagerService,
	) {
		super(fileManagerService);
	}

	onModuleInit() {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			'metadata'
		);
	}

	buildIllustrationFolderPath(artistSlug?: Slug): string {
		if (!artistSlug) {
			artistSlug = new Slug(compilationAlbumArtistKeyword);
		}
		return join(
			this.baseIllustrationFolderPath,
			artistSlug.toString()
		);
	}

	buildIllustrationLink(identifier: Identifier): string {
		return `${this.IllustrationControllerPath}/artists/${identifier}`;
	}

	async formatWhereInputToIdentifiers(
		where: ArtistQueryParameters.WhereInput
	): Promise<ServiceArgs> {
		if (where.slug != undefined) {
			return [where.slug];
		}
		if (where.compilationArtist) {
			return [undefined];
		}
		return this.artistService
			.select(where, { slug: true })
			.then(({ slug }) => [new Slug(slug)]);
	}

	@OnRepositoryEvent('created', 'Artist', { async: true })
	async onArtistCreation(artist: Artist) {
		return this.providerService
			.getArtistIllustrationUrl(artist.name)
			.then(async (url) => {
				await this.illustrationService.downloadIllustration(
					url,
					this.buildIllustrationPath(new Slug(artist.slug))
				).then(() => this.logger.log(`Illustration for artist '${artist.slug}' downloaded`));
			}).catch((error) =>
				this.logger.error(`Downloading Artist Illustration for ${artist.slug} failed: ` + error.message));
	}
}
