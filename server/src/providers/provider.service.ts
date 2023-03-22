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
import { OnRepositoryEvent } from "src/events/event.decorators";
import {
	Artist, Provider, Song
} from "src/prisma/models";

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

	@OnRepositoryEvent('created', 'Artist', { async: true })
	protected async onArtistCreatedEvent(artist: Artist) {
		const ids = await this.collectActions(async (provider) => {
			const id = await provider.getArtistIdentifier(artist.name);

			this.logger.verbose(`${provider.name} external id for artist '${artist.name}' found`);
			return { provider, id };
		});

		await Promise.allSettled(
			ids.map(({ provider, id }) =>
				this.prismaService.artistExternalId.create({
					data: {
						artist: { connect: { id: artist.id } },
						provider: { connect: { name: provider.name } },
						value: (id as string).toString()
					},
				}))
		);
	}

	@OnRepositoryEvent('created', 'Album', { async: true })
	protected async onAlbumCreatedEvent(album: Song) {
		const artist = album.artistId ? await this.prismaService.artist.findFirst({
			where: { id: album.artistId },
			include: { externalIds: { include: { provider: true } } }
		}) : null;
		const ids = await this.collectActions(async (provider) => {
			const id = await provider.getAlbumIdentifier(
				album.name,
				artist?.externalIds.find((externalId) => externalId.provider.name == provider.name)
			);

			this.logger.verbose(`${provider.name} external id for album '${album.name}' found`);
			return { provider, id };
		});

		await Promise.allSettled(
			ids.map(({ provider, id }) =>
				this.prismaService.albumExternalId.create({
					data: {
						album: { connect: { id: album.id } },
						provider: { connect: { name: provider.name } },
						value: (id as string).toString()
					},
				}))
		);
	}

	@OnRepositoryEvent('created', 'Song', { async: true })
	protected async onSongCreatedEvent(song: Song) {
		const artist = await this.prismaService.artist.findUnique({
			where: { id: song.artistId },
			include: { externalIds: { include: { provider: true } } }
		});
		const ids = await this.collectActions(async (provider) => {
			const id = await provider.getSongIdentifier(
				song.name,
				artist?.externalIds.find((externalId) => externalId.provider.name == provider.name)
			);

			this.logger.verbose(`${provider.name} external id for song '${song.name}' found`);
			return { provider, id };
		});

		await Promise.allSettled(
			ids.map(({ provider, id }) =>
				this.prismaService.songExternalId.create({
					data: {
						song: { connect: { id: song.id } },
						provider: { connect: { name: provider.name } },
						value: (id as string).toString()
					},
				}))
		);
	}

	/**
	 * Calls action method on each enabled provider, until one suceeds
	 * If all fails, rejects
	 */
	private async runAction<Returns>(
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>,
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
	private async collectActions<Returns>(
		action: (provider: IProvider<unknown, unknown>) => Promise<Returns>,
	): Promise<Returns[]> {
		const promiseResultsFilter = (result: PromiseSettledResult<Returns>):
			result is PromiseFulfilledResult<Awaited<Returns>> => result.status == 'fulfilled';

		return Promise.allSettled(this._enabledProviders.map(action))
			.then((results) => results
				.filter(promiseResultsFilter)
				.map((result) => result.value));
	}
}
