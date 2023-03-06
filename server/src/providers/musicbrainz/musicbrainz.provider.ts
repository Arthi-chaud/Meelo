import { Injectable } from "@nestjs/common";
import IProvider from "../iprovider";

@Injectable()
export default class MusicBrainzProvider extends IProvider<MusicBrainzProvider, unknown> {
	constructor() {
		super('musicbrainz');
	}

	getProviderBannerUrl(): string {
		return "https://wiki.musicbrainz.org/images/a/a9/MusicBrainz_Logo_Transparent.png";
	}

	getProviderIconUrl(): string {
		return "https://upload.wikimedia.org/wikipedia/commons/8/8c/MusicBrainz_Picard_logo.svg";
	}
}
