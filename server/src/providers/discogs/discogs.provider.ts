import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider from "../iprovider";
import DiscogsSettings from "./discogs.settings";

@Injectable()
export default class DiscogsProvider extends IProvider<DiscogsSettings> implements OnModuleInit {
	constructor() {
		super('discogs');
	}

	onModuleInit() {}

	getProviderHomepage(): string {
		return 'https://www.discogs.com';
	}

	getProviderBannerUrl(): string {
		return 'https://st.discogs.com/7790e868083f99e9f3293cb4a33581347374b4c6/images/discogs-primary-logo.png';
	}

	getProviderIconUrl(): string {
		return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Discogs_record_icon.svg/240px-Discogs_record_icon.svg.png';
	}

	getReleaseURL(releaseIdentifier: string): string {
		return `${this.getProviderHomepage()}/release/${releaseIdentifier}`;
	}
}
