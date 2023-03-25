import { Injectable, OnModuleInit } from "@nestjs/common";
import MusixMatchProvider from "./musixmatch/musixmatch.provider";
import IProvider from "./iprovider";
import SettingsService from "src/settings/settings.service";
import { AllProvidersFailedError } from "./provider.exception";
import Logger from "src/logger/logger";
import GeniusProvider from "./genius/genius.provider";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { Provider } from "src/prisma/models";

/**
 * Orchestrates of Providers
 */
@Injectable()
export default class ProviderService implements OnModuleInit {
	private readonly _enabledProviders: IProvider<unknown, unknown>[] = [];
	private readonly logger = new Logger(ProviderService.name);
	private readonly _providerCatalogue: IProvider<unknown, unknown>[] = [];
	private readonly _providerRows: Provider[] = [];

	constructor(
		musixmatchProvider: MusixMatchProvider,
		geniusProvider: GeniusProvider,
		musicbrainzProvider: MusicBrainzProvider,
		private prismaService: PrismaService,
		private settingsService: SettingsService
	) {
		this._providerCatalogue = [musixmatchProvider, geniusProvider, musicbrainzProvider];
	}

	getProviderById(id: number) {
		return this._providerCatalogue.find(
			({ name }) => this._providerRows.find(
				(provider) => provider.id == id
			)?.name == name
		)!;
	}

	get enabledProviders() {
		return this._enabledProviders.map((provider) => provider.name);
	}

	get providerCatalogue() {
		return this._providerCatalogue.map((provider) => provider.name);
	}

	async onModuleInit() {
		const providerSettings = this.settingsService.settingsValues.providers;

		// Flushing the enabled provider list, before pushing everything back again
		// In case of resets
		this._enabledProviders.splice(0, this._enabledProviders.length);
		this._providerRows.splice(0, this._providerRows.length);
		this._providerCatalogue.forEach((provider) => {
			if (providerSettings[provider.name]?.enabled === true) {
				this.logger.log(`Provider '${provider.name}' enabled`);
				provider.settings = providerSettings[provider.name];
				this._enabledProviders.push(provider);
			} else {
				this.logger.warn(`Provider '${provider.name}' disabled`);
			}
		});
		this._providerRows.push(...await this.prismaService.$transaction(
			this._providerCatalogue.map((provider) => {
				const providerSlug = new Slug(provider.name).toString();

				return this.prismaService.provider.upsert({
					create: {
						name: provider.name,
						slug: providerSlug
					},
					where: { slug: providerSlug },
					update: {}
				});
			})
		));
	}

	/**
	 * Builds Prisma Query to fetchesources that miss an external id
	 */
	private buildQueryForMissingProviderId() {
		const providerIdFilter = {
			providerId: {
				notIn: this._enabledProviders
					.map((provider) => provider.name)
					.map((providerName) => this._providerRows
						.find((provider) => provider.name == providerName)!.id)
			}
		};

		return {
			where: {
				OR: [
					{ externalIds: { some: providerIdFilter } },
					{ externalIds: { none: providerIdFilter } }
				]
			},
			include: { externalIds: { include: { provider: true } } }
		};
	}

	/**
	 * Fetch & registers missing External IDs for artists
	 */
	async fetchMissingArtistExternalIDs() {
		const artists = await this.prismaService.artist.findMany(
			this.buildQueryForMissingProviderId()
		);

		for (const artist of artists) {
			const externalIds = artist.externalIds;
			const missingProviders = this._enabledProviders
				.filter((provider) => externalIds
					.map((id) => id.provider.name)
					.includes(provider.name) == false);
			const newIds = await this.collectActions(async (provider) => ({
				providerName: provider.name,
				providerId: this._providerRows
					.find((providerRow) => providerRow.name == provider.name)!.id,
				artistId: artist.id,
				value: (await provider.getArtistIdentifier(artist.name) as string).toString()
			}), missingProviders);

			newIds.map((id) => this.logger.verbose(`External ID from ${id.providerName} found for artist ${artist.name}`));
			await this.prismaService.artistExternalId.createMany({
				data: newIds.map(({ providerName, ...id }) => id),
				skipDuplicates: true
			});
		}
	}

	getAlbumType(albumName: string, artistName?: string) {
		return this.runAction(async (provider) => {
			const artistId = artistName
				? await provider.getArtistIdentifier(artistName)
				: undefined;
			const albumId = await provider.getAlbumIdentifier(albumName, artistId);

			return provider.getAlbumType(albumId);
		});
	}

	getAlbumDescription(albumName: string, artistName?: string) {
		return this.runAction(async (provider) => {
			const artistId = artistName
				? await provider.getArtistIdentifier(artistName)
				: undefined;
			const albumId = await provider.getAlbumIdentifier(albumName, artistId);

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
		}).then((genres) => genres.flat());
	}

	/**
	 * Calls action method on each enabled provider, until one suceeds
	 * If all fails, rejects
	 */
	private async runAction<Returns>(
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>,
		providers?: IProvider<unknown, unknown>[]
	): Promise<Returns> {
		for (const provider of (providers ?? this._enabledProviders)) {
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
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>,
		providers?: IProvider<unknown, unknown>[]
	): Promise<Returns[]> {
		const promiseResultsFilter = (result: PromiseSettledResult<Returns>):
			result is PromiseFulfilledResult<Awaited<Returns>> => result.status == 'fulfilled';

		return Promise.allSettled((providers ?? this._enabledProviders).map(action))
			.then((results) => results
				.filter(promiseResultsFilter)
				.map((result) => result.value));
	}
}
