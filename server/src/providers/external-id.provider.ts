import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import PrismaService from "src/prisma/prisma.service";
import ProviderService from "./provider.service";
import Logger from "src/logger/logger";
import IProvider from "./iprovider";
import { Provider } from "src/prisma/models";

@Injectable()
export default class ExternalIdService {
	private readonly logger: Logger = new Logger(ExternalIdService.name);
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService
	) {}

	/**
	 * Builds Prisma Query to fetchesources that miss an external id
	 */
	private buildQueryForMissingProviderId() {
		const providerIdFilter = {
			provider: {
				name: {
					notIn: this.providerService.enabledProviders
				}
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

	private async fetchMissingResourceExternalId<R, ActionReturn, IDType>(
		resources: (R & { externalIds: (IDType & { provider: Provider } []) })[],
		action: (resource: R, provider: IProvider<unknown, unknown>) =>
			Promise<ActionReturn | undefined>,
		onActionGroupSuccess: (resource: R, res: ActionReturn[]) => Promise<void>,
	) {
		for (const resource of resources) {
			const externalIds = resource.externalIds;
			const missingProviders = this.providerService.enabledProviders
				.filter((providerName) => externalIds
					.map((id) => id.provider.name)
					.includes(providerName) == false);
			const newIds = (await this.providerService.collectActions(async (provider) => {
				if (missingProviders.includes(provider.name) == false) {
					return undefined;
				}
				return action(resource, provider);
			})).filter((id): id is Exclude<typeof id, undefined> => id !== undefined);

			await onActionGroupSuccess(resource, newIds);
		}
	}

	/**
	 * Fetch & registers missing External IDs for artists
	 */
	async fetchMissingArtistExternalIDs() {
		const artists = await this.prismaService.artist.findMany(
			this.buildQueryForMissingProviderId()
		);

		await this.fetchMissingResourceExternalId(
			artists,
			async (artist, provider) => {
				const identifier = (await provider.getArtistIdentifier(artist.name)
					.then((value) => (value as string).toString()));
				const description = (await provider.getArtistDescription(identifier)
					.then((value) => (value as string).toString())
					.catch(() => null));

				return {
					providerName: provider.name,
					providerId: this.providerService.getProviderId(provider.name),
					artistId: artist.id,
					description: description,
					value: identifier
				};
			},
			async (artist, res) => {
				res.forEach(({ providerName }) =>
					this.logger.verbose(`External ID from ${providerName} found for artist '${artist.name}'`));
				await this.prismaService.artistExternalId.createMany({
					data: res.map(({ providerName, ...id }) => id),
					skipDuplicates: true
				});
			}
		);
	}

	/**
	 * Fetch & registers missing External IDs for albums
	 */
	async fetchMissingAlbumExternalIDs() {
		const query = this.buildQueryForMissingProviderId();
		const albums = await this.prismaService.album.findMany({
			...query,
			include: {
				artist: true,
				...query.include
			}
		});

		await this.fetchMissingResourceExternalId(
			albums,
			async (album, provider) => {
				const artistExternalId = album.artistId ?
					(await this.prismaService.artistExternalId.findFirst({
						where: {
							artistId: album.artistId,
							provider: { name: provider.name }
						}
					}))?.value : undefined;
				const albumExternalId = await provider
					.getAlbumIdentifier(album.name, artistExternalId);
				const description = (await provider.getAlbumDescription(albumExternalId)
					.then((value) => (value as string).toString())
					.catch(() => null));

				return {
					providerName: provider.name,
					providerId: this.providerService.getProviderId(provider.name),
					albumId: album.id,
					description: description,
					value: (albumExternalId as string).toString()
				};
			},
			async (album, res) => {
				res.forEach(({ providerName }) =>
					this.logger.verbose(`External ID from ${providerName} found for album '${album.name}'`));
				await this.prismaService.albumExternalId.createMany({
					data: res.map(({ providerName, ...id }) => id),
					skipDuplicates: true
				});
			}
		);
	}

	/**
	 * Fetch & registers missing External IDs for songs
	 */
	async fetchMissingSongExternalIDs() {
		const query = this.buildQueryForMissingProviderId();
		const songs = await this.prismaService.song.findMany({
			...query,
			include: {
				artist: true,
				...query.include
			}
		});

		await this.fetchMissingResourceExternalId(
			songs,
			async (song, provider) => {
				const artistExternalId = (await this.prismaService.artistExternalId.findFirst({
					where: {
						artistId: song.artistId,
						provider: { name: provider.name }
					}
				}))?.value;

				if (!artistExternalId) {
					return undefined;
				}
				const songExternalId = await provider
					.getSongIdentifier(song.name, artistExternalId);
				const description = (await provider.getSongDescription(songExternalId)
					.then((value) => (value as string).toString())
					.catch(() => null));

				return {
					providerName: provider.name,
					providerId: this.providerService.getProviderId(provider.name),
					songId: song.id,
					description: description,
					value: (songExternalId as string).toString()
				};
			},
			async (song, res) => {
				res.forEach(({ providerName }) =>
					this.logger.verbose(`External ID from ${providerName} found for song '${song.name}'`));
				await this.prismaService.songExternalId.createMany({
					data: res.map(({ providerName, ...id }) => id),
					skipDuplicates: true
				});
			}
		);
	}
}
