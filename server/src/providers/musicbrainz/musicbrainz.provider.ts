import {
	Inject, Injectable, OnModuleInit, forwardRef
} from "@nestjs/common";
import IProvider from "../iprovider";
import * as mb from "musicbrainz-api";
import {
	name as AppName, version as AppVersion, homepage as Homepage
} from 'package.json';
import SettingsService from "src/settings/settings.service";
import MusicBrainzSettings from "./musicbrainz.settings";
import { ProviderActionFailedError } from "../provider.exception";

type MBID = string;

@Injectable()
export default class MusicBrainzProvider extends IProvider<MusicBrainzSettings, MBID> implements OnModuleInit {
	private mbClient: mb.MusicBrainzApi;

	constructor(
		@Inject(forwardRef(() => SettingsService))
		private settingsSettings: SettingsService
	) {
		super('musicbrainz');
	}

	onModuleInit() {
		this._settings = this.settingsSettings.settingsValues.providers.musicbrainz;
		this.mbClient = new mb.MusicBrainzApi({
			appName: AppName,
			appVersion: AppVersion,
			appContactInfo: Homepage
		});
	}

	getProviderBannerUrl(): string {
		return "https://wiki.musicbrainz.org/images/a/a9/MusicBrainz_Logo_Transparent.png";
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/8/8c/MusicBrainz_Picard_logo.svg";
	}

	async getArtistIdentifier(artistName: string, _songName?: string): Promise<MBID> {
		try {
			const searchResult = await this.mbClient.searchArtist({ query: artistName });

			return searchResult.artists.at(0)!.id;
		} catch (err) {
			throw new ProviderActionFailedError(this.name, 'getArtistIdentifier', err.message);
		}
	}
}
