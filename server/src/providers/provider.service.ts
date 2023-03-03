import { Injectable } from "@nestjs/common";
import MusixMatchProvider from "./musixmatch/musixmatch.provider";
import IProvider from "./iprovider";
import SettingsService from "src/settings/settings.service";
import { AllProvidersFailedError } from "./provider.exception";
import Logger from "src/logger/logger";
import GeniusProvider from "./genius/genius.provider";

/**
 * Orchestrates of Providers
 */
@Injectable()
export default class ProviderService {
	private readonly enabledProviders: IProvider<unknown>[] = [];
	private readonly logger = new Logger(ProviderService.name);

	constructor(
		musixmatchProvider: MusixMatchProvider,
		geniusProvider: GeniusProvider,
		private settingsService: SettingsService
	) {
		const providersSettings = this.settingsService.settingsValues.providers;
		const providers = [musixmatchProvider, geniusProvider];

		providers.forEach((provider) => {
			if (providersSettings[provider.name]?.enabled === true) {
				this.logger.log(`Provider '${provider.name}' enabled`);
				provider.settings = providersSettings[provider.name];
				this.enabledProviders.push(provider);
			} else {
				this.logger.warn(`Provider '${provider.name}' disabled`);
			}
		});
	}

	getAlbumType(albumName: string, artistName?: string) {
		return this.runAction(async (provider) => {
			const albumId = await provider.getAlbumIdentifier(albumName, artistName);

			return provider.getAlbumType(albumId);
		});
	}

	getArtistIllustrationUrl(artistName: string, songName?: string) {
		return this.runAction(async (provider) => {
			const artistId = await provider.getArtistIdentifier(artistName, songName);

			return provider.getArtistIllustrationUrl(artistId);
		});
	}

	getSongLyrics(songName: string, artistName: string) {
		return this.runAction(async (provider) => {
			const artistId = await provider.getArtistIdentifier(artistName, songName);
			const songId = await provider.getSongIdentifier(songName, artistId);

			return provider.getSongLyrics(songId);
		});
	}

	getSongGenres(songName: string, artistName: string) {
		return this.runAction(async (provider) => {
			const artistId = await provider.getArtistIdentifier(artistName, songName);
			const songId = await provider.getSongIdentifier(songName, artistId);

			return provider.getSongGenres(songId);
		});
	}

	/**
	 * Calls action method on each enabled provider, until one suceeds
	 * If all fails, rejects
	 */
	private async runAction<Returns>(
		action: (provider: IProvider<unknown>) => Promise<Returns>,
	): Promise<Awaited<Returns>> {
		for (const provider of this.enabledProviders) {
			try {
				return await action(provider);
			} catch {
				continue;
			}
		}
		throw new AllProvidersFailedError();
	}
}
