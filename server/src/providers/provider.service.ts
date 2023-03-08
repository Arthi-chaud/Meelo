import { Injectable } from "@nestjs/common";
import MusixMatchProvider from "./musixmatch/musixmatch.provider";
import IProvider from "./iprovider";
import SettingsService from "src/settings/settings.service";
import { AllProvidersFailedError } from "./provider.exception";
import Logger from "src/logger/logger";
import GeniusProvider from "./genius/genius.provider";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";

/**
 * Orchestrates of Providers
 */
@Injectable()
export default class ProviderService {
	private readonly enabledProviders: IProvider<unknown, unknown>[] = [];
	private readonly logger = new Logger(ProviderService.name);

	constructor(
		musixmatchProvider: MusixMatchProvider,
		geniusProvider: GeniusProvider,
		musicbrainzProvider: MusicBrainzProvider,
		private settingsService: SettingsService
	) {
		const providersSettings = this.settingsService.settingsValues.providers;
		const providers = [musixmatchProvider, geniusProvider, musicbrainzProvider];

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

	getAlbumDescription(albumName: string, artistName?: string) {
		return this.runAction(async (provider) => {
			const albumId = await provider.getAlbumIdentifier(albumName, artistName);

			return provider.getAlbumDescription(albumId);
		});
	}

	getArtistDescription(artistName: string) {
		return this.runAction(async (provider) => {
			const artistId = await provider.getArtistIdentifier(artistName);

			return provider.getArtistDescription(artistId);
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
		return this.collectActions(async (provider) => {
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
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>,
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

	/**
	 * Calls action method on each enabled provider, and returns all successes
	 */
	private async collectActions<Returns>(
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns[]>,
	): Promise<Returns[]> {
		const promiseResultsFilter = (result: PromiseSettledResult<Returns[]>):
			result is PromiseFulfilledResult<Returns[]> => result.status == 'fulfilled';

		return Promise.allSettled(this.enabledProviders.map(action))
			.then((results) => results
				.filter(promiseResultsFilter)
				.map((result) => result.value)
				.flat());
	}
}
