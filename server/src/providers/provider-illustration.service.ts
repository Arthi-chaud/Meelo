import {
	Inject, Injectable, OnModuleInit, forwardRef
} from '@nestjs/common';
import FileManagerService from 'src/file-manager/file-manager.service';
import SettingsService from 'src/settings/settings.service';
import { join } from 'path';
import ProviderService from 'src/providers/provider.service';
import IllustrationService from 'src/illustration/illustration.service';
import ProvidersSettings from './models/providers.settings';
import Slug from 'src/slug/slug';

type ProviderName = keyof ProvidersSettings;

@Injectable()
export default class ProvidersIllustrationService implements OnModuleInit {
	private baseIllustrationFolderPath: string;
	constructor(
		private settingsService: SettingsService,
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		private fileManagerService: FileManagerService,
	) { }

	onModuleInit() {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			'metadata',
			'_providers'
		);
	}

	buildIllustrationFolderPath(providerName: ProviderName): string {
		return join(
			this.baseIllustrationFolderPath,
			new Slug(providerName).toString()
		);
	}

	buildIconPath(providerName: ProviderName): string {
		return join(
			this.buildIllustrationFolderPath(providerName),
			'icon.png'
		);
	}

	buildBannerPath(providerName: ProviderName): string {
		return join(
			this.buildIllustrationFolderPath(providerName),
			'banner.png'
		);
	}

	downloadMissingProviderImages() {
		this.providerService.collectActions(async (provider) => {
			const bannerPath = this.buildBannerPath(provider.name);
			const iconPath = this.buildIconPath(provider.name);

			if (!this.fileManagerService.fileExists(iconPath)) {
				this.illustrationService.downloadIllustration(provider.getProviderIconUrl())
					.catch(() => {})
					.then((buffer) => {
						if (buffer) {
							this.illustrationService.saveIllustration(buffer, iconPath);
						}
					});
			}
			if (!this.fileManagerService.fileExists(bannerPath)) {
				this.illustrationService.downloadIllustration(provider.getProviderBannerUrl())
					.catch(() => {})
					.then((buffer) => {
						if (buffer) {
							this.illustrationService.saveIllustration(buffer, bannerPath);
						}
					});
			}
		});
	}
}
