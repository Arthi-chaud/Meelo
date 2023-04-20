import {
	Inject, Injectable, OnModuleInit, forwardRef
} from '@nestjs/common';
import RepositoryIllustrationService from 'src/repository/repository-illustration.service';
import FileManagerService from 'src/file-manager/file-manager.service';
import SettingsService from 'src/settings/settings.service';
import { join } from 'path';
import Slug from 'src/slug/slug';
import PlaylistService from './playlist.service';
import PlaylistQueryParameters from './models/playlist.query-parameters';
import Identifier from 'src/identifier/models/identifier';

type WhereArgs = [playlistSlug: Slug];

@Injectable()
export default class PlaylistIllustrationService extends RepositoryIllustrationService<
	WhereArgs, PlaylistQueryParameters.WhereInput
> implements OnModuleInit {
	private baseIllustrationFolderPath: string;
	constructor(
		private settingsService: SettingsService,
		@Inject(forwardRef(() => PlaylistService))
		private playlistService: PlaylistService,
		fileManagerService: FileManagerService,
	) {
		super(fileManagerService);
	}

	onModuleInit() {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			'metadata',
			'_playlists'
		);
	}

	buildIllustrationFolderPath(playlistSlug: Slug): string {
		return join(
			this.baseIllustrationFolderPath,
			playlistSlug.toString()
		);
	}

	buildIllustrationLink(identifer: Identifier): string {
		return `${this.IllustrationControllerPath}/playlists/${identifer.toString()}`;
	}

	async formatWhereInputToIdentifiers(
		where: PlaylistQueryParameters.WhereInput
	): Promise<WhereArgs> {
		if (where.slug) {
			return [where.slug];
		}
		return this.playlistService
			.get(where)
			.then((playlist): WhereArgs => [new Slug(playlist.slug)]);
	}
}
