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
		onActionSuccess: (resource: R, res: ActionReturn) => void,
	) {
		const ids: ActionReturn[] = [];

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

			newIds.forEach((id) => onActionSuccess(resource, id));
			ids.push(...newIds);
		}
		return ids;
	}

	/**
	 * Fetch & registers missing External IDs for artists
	 */
	async fetchMissingArtistExternalIDs() {
		const artists = await this.prismaService.artist.findMany(
			this.buildQueryForMissingProviderId()
		);
		const newIds = await this.fetchMissingResourceExternalId(
			artists,
			async (artist, provider) => ({
				providerName: provider.name,
				providerId: this.providerService.getProviderId(provider.name),
				artistId: artist.id,
				value: (await provider.getArtistIdentifier(artist.name) as string).toString()
			}),
			(artist, res) => this.logger
				.verbose(`External ID from ${res.providerName} found for artist '${artist.name}'`)
		);

		await this.prismaService.artistExternalId.createMany({
			data: newIds.map(({ providerName, ...id }) => id),
			skipDuplicates: true
		});
	}

	/**
	 * Fetch & registers missing External IDs for albums
	 */
	async fetchMissingAlbumExternalIDs() {
		const query = this.buildQueryForMissingProviderId();
		const albums = await this.prismaService.album.findMany({
			...query,
			include: {
				artist: { include: { externalIds: { include: { provider: true } } } },
				...query.include
			}
		});
		const newIds = await this.fetchMissingResourceExternalId(
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

				return {
					providerName: provider.name,
					providerId: this.providerService.getProviderId(provider.name),
					albumId: album.id,
					value: (albumExternalId as string).toString()
				};
			},
			(album, res) => this.logger
				.verbose(`External ID from ${res.providerName} found for album '${album.name}'`)
		);

		await this.prismaService.albumExternalId.createMany({
			data: newIds.map(({ providerName, ...id }) => id),
			skipDuplicates: true
		});
	}
}
