import { Injectable } from "@nestjs/common";
import MusixMatchProvider from "./musixmatch/musixmatch.provider";
import IProvider from "./iprovider";
import SettingsService from "src/settings/settings.service";
import ProviderActions from "./provider-actions";
import { AllProvidersFailedError } from "./provider.exception";
import Logger from "src/logger/logger";

/**
 * Orchestrates of Providers
 */
@Injectable()
export default class ProviderService implements ProviderActions {
	private readonly enabledProviders: IProvider<unknown>[];
	private readonly logger = new Logger(ProviderService.name);

	constructor(
		musixmatchProvider: MusixMatchProvider,
		private settingsService: SettingsService
	) {
		const providersSettings = this.settingsService.settingsValues.providers;
		const providers = [musixmatchProvider];

		providers.forEach((provider) => {
			if (providersSettings[provider.name].enabled === true) {
				this.logger.log(`Provider '${provider.name}' enabled`);
				provider.settings = providersSettings[provider.name];
				this.enabledProviders.push(provider);
			} else {
				this.logger.warn(`Provider '${provider.name}' disabled`);
			}
		});
	}

	getArtistIdentifier(...parameters: Parameters<ProviderActions['getArtistIdentifier']>) {
		return this.runAction('getArtistIdentifier', parameters);
	}

	getSongIdentifier(...parameters: Parameters<ProviderActions['getSongIdentifier']>) {
		return this.runAction('getSongIdentifier', parameters);
	}

	getAlbumIdentifier(...parameters: Parameters<ProviderActions['getAlbumIdentifier']>) {
		return this.runAction('getAlbumIdentifier', parameters);
	}

	getAlbumType(...parameters: Parameters<ProviderActions['getAlbumType']>) {
		return this.runAction('getAlbumType', parameters);
	}

	getArtistIllustrationUrl(...parameters: Parameters<ProviderActions['getArtistIllustrationUrl']>) {
		return this.runAction('getArtistIllustrationUrl', parameters);
	}

	getSongLyrics(...parameters: Parameters<ProviderActions['getSongLyrics']>) {
		return this.runAction('getSongLyrics', parameters);
	}

	getSongGenres(...parameters: Parameters<ProviderActions['getSongGenres']>) {
		return this.runAction('getSongGenres', parameters);
	}

	/**
	 * Calls action method on each enabled provider, until one suceeds
	 * If all fails, rejects
	 */
	private async runAction<ActionName extends keyof ProviderActions = keyof ProviderActions>(
		actionName: ActionName,
		parameters: Parameters<ProviderActions[ActionName]>
	): Promise<Awaited<ReturnType<ProviderActions[ActionName]>>> {
		for (const provider of this.enabledProviders) {
			try {
				return await provider[actionName].call(provider, ...parameters);
			} catch {
				continue;
			}
		}
		throw new AllProvidersFailedError(actionName);
	}
}
