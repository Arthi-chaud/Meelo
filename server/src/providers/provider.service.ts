import { Injectable } from "@nestjs/common";
import MusixMatchProvider from "./musixmatch/musixmatch.provider";
import IProvider from "./iprovider";
import SettingsService from "src/settings/settings.service";
import ProviderActions from "./provider-actions";
import { AlbumType } from "@prisma/client";

/**
 * Orchestrates of Providers
 */
@Injectable()
export default class ProviderService implements ProviderActions {
	private readonly enabledProviders: IProvider<unknown>[];

	constructor(
		musixmatchProvider: MusixMatchProvider,
		private settingsService: SettingsService
	) {
		const providersSettings = this.settingsService.settingsValues.providers;
		const providers = [musixmatchProvider];

		providers.forEach((provider) => {
			if (providersSettings[provider.name].enabled === true) {
				provider.settings = providersSettings[provider.name];
				this.enabledProviders.push(provider);
			}
		});
	}

	getArtistIdentifier(artistName: string, songName?: string | undefined): Promise<string> {
		throw new Error("Method not implemented.");
	}

	getSongIdentifier(songName: string, artistName: string): Promise<string> {
		throw new Error("Method not implemented.");
	}

	getAlbumIdentifier(albumName: string, artistName?: string | undefined): Promise<string> {
		throw new Error("Method not implemented.");
	}

	getAlbumType(albumIdentifer: string): Promise<AlbumType> {
		throw new Error("Method not implemented.");
	}

	getArtistIllustrationUrl(artistIdentifer: string): Promise<string> {
		throw new Error("Method not implemented.");
	}

	getSongLyrics(songIdentifier: string): Promise<string> {
		throw new Error("Method not implemented.");
	}

	getSongGenres(songIdentifier: string): Promise<string[]> {
		throw new Error("Method not implemented.");
	}
}
