import {
	Inject, Injectable, OnModuleInit, forwardRef
} from "@nestjs/common";
import IProvider from "./iprovider";
import SettingsService from "src/settings/settings.service";
import { AllProvidersFailedError } from "./provider.exception";
import Logger from "src/logger/logger";
import GeniusProvider from "./genius/genius.provider";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";
import { Provider } from "src/prisma/models";
import ProvidersIllustrationService from "./provider-illustration.service";
import DiscogsProvider from "./discogs/discogs.provider";

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
		geniusProvider: GeniusProvider,
		musicbrainzProvider: MusicBrainzProvider,
		discogsProvider: DiscogsProvider,
		private prismaService: PrismaService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => ProvidersIllustrationService))
		private providerIllustrationService: ProvidersIllustrationService,
	) {
		this._providerCatalogue = [geniusProvider, musicbrainzProvider, discogsProvider];
	}

	getProviderById(id: number) {
		return this._providerCatalogue.find(
			({ name }) => this._providerRows.find(
				(provider) => provider.id == id
			)?.name == name
		)!;
	}

	getProviderId(providerName: typeof IProvider<unknown, unknown>['prototype']['name']) {
		return this._providerRows.find((provider) => provider.name == providerName)!.id;
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
		this.providerIllustrationService.downloadMissingProviderImages();
	}

	/**
	 * Calls action method on each enabled provider, until one suceeds
	 * If all fails, rejects
	 */
	async runAction<Returns>(
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>
	): Promise<Returns> {
		for (const provider of this._enabledProviders) {
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
	async collectActions<Returns>(
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>
	): Promise<Returns[]> {
		const promiseResultsFilter = (result: PromiseSettledResult<Returns>):
			result is PromiseFulfilledResult<Awaited<Returns>> => result.status == 'fulfilled';

		return Promise.allSettled(this._enabledProviders.map(action))
			.then((results) => results
				.filter(promiseResultsFilter)
				.map((result) => result.value));
	}
}
