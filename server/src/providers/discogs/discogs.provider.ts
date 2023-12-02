import { Injectable, OnModuleInit } from "@nestjs/common";
import IProvider, {
	AlbumMetadata, ArtistMetadata, ReleaseMetadata
} from "../iprovider";
import DiscogsSettings from "./discogs.settings";
import { HttpService } from "@nestjs/axios";
import { ProviderActionFailedError } from "../provider.exception";
import {
	homepage, name, version
} from 'package.json';
import { isNumber, isString } from "class-validator";
import SettingsService from "src/settings/settings.service";

@Injectable()
export default class DiscogsProvider extends IProvider<DiscogsSettings> implements OnModuleInit {
	constructor(
		private readonly httpService: HttpService,
		private settingsService: SettingsService
	) {
		super('discogs');
	}

	onModuleInit() {
		this._settings = this.settingsService.settingsValues.providers.discogs;
	}

	getProviderHomepage(): string {
		return 'https://www.discogs.com';
	}

	getProviderBannerUrl(): string {
		return 'https://st.discogs.com/7790e868083f99e9f3293cb4a33581347374b4c6/images/discogs-primary-logo.png';
	}

	getProviderIconUrl(): string {
		return 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Discogs_record_icon.svg/256px-Discogs_record_icon.svg.png';
	}

	getArtistURL(artistIdentifier: string): string {
		return `${this.getProviderHomepage()}/artist/${artistIdentifier}`;
	}

	getAlbumURL(albumIdentifier: string): string {
		return `${this.getProviderHomepage()}/master/${albumIdentifier}`;
	}

	getReleaseURL(releaseIdentifier: string): string {
		return `${this.getProviderHomepage()}/release/${releaseIdentifier}`;
	}

	async getArtistMetadataByIdentifier(artistIdentifier: string): Promise<ArtistMetadata> {
		try {
			const artist = await this.fetch(`/artists/${artistIdentifier}`);

			if (isNumber(artist.id) && isString(artist.profile_plaintext)) {
				return {
					value: artist.id.toString(),
					description: artist.profile_plaintext
				};
			}
			throw new ProviderActionFailedError(this.name, 'getArtistMetadataByIdentifier', 'Invalid Data Type');
		} catch {
			throw new ProviderActionFailedError(this.name, 'getArtistMetadataByIdentifier', 'Artist Not Found');
		}
	}

	async getAlbumMetadataByIdentifier(masterIdentifier: string): Promise<AlbumMetadata> {
		try {
			const album = await this.fetch(`/masters/${masterIdentifier}`);

			if (isNumber(album.id) && isString(album.notes_plaintext)) {
				return {
					genres: album.genres,
					value: album.id.toString(),
					rating: null,
					description: album.notes_plaintext
				};
			}
			throw new ProviderActionFailedError(this.name, 'getAlbumMetadataByIdentifier', 'Invalid Data Type');
		} catch {
			throw new ProviderActionFailedError(this.name, 'getAlbumMetadataByIdentifier', 'Album Not Found');
		}
	}

	async getReleaseMetadataByIdentifier(releaseIdentifier: string): Promise<ReleaseMetadata> {
		try {
			const release = await this.fetch(`/releases/${releaseIdentifier}`);

			if (isNumber(release.id) && isString(release.notes_plaintext)) {
				return {
					value: release.id.toString(),
					description: release.notes_plaintext
				};
			}
			throw new ProviderActionFailedError(this.name, 'getReleaseMetadataByIdentifier', 'Invalid Data Type');
		} catch {
			throw new ProviderActionFailedError(this.name, 'getReleaseMetadataByIdentifier', 'Release Not Found');
		}
	}

	async fetch(route: string): Promise<any> {
		const accessToken = process.env.NODE_ENV == 'test'
			? process.env.DISCOGS_ACCESS_TOKEN
			: this.settings.apiKey;

		try {
			return this.httpService.axiosRef.get(route, {
				baseURL: 'https://api.discogs.com',
				params: { token: accessToken },
				headers: {
					"Accept": "application/vnd.discogs.v2.plaintext+json",
					"User-Agent": `${name}/${version} +${homepage}`
				}
			}).then((res) => res.data);
		} catch {
			throw new ProviderActionFailedError(this.name, 'getArtistMetadataByIdentifier', 'Artist Not Found');
		}
	}
}
