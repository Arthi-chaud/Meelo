import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import PrismaService from "src/prisma/prisma.service";
import ProviderService from "./provider.service";
import Logger from "src/logger/logger";

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

	/**
	 * Fetch & registers missing External IDs for artists
	 */
	async fetchMissingArtistExternalIDs() {
		const artists = await this.prismaService.artist.findMany(
			this.buildQueryForMissingProviderId()
		);

		for (const artist of artists) {
			const externalIds = artist.externalIds;
			const missingProviders = this.providerService.enabledProviders
				.filter((providerName) => externalIds
					.map((id) => id.provider.name)
					.includes(providerName) == false);
			const newIds = (await this.providerService.collectActions(async (provider) => {
				if (missingProviders.includes(provider.name) == false) {
					return undefined;
				}
				return {
					providerName: provider.name,
					providerId: this.providerService.getProviderId(provider.name),
					artistId: artist.id,
					value: (await provider.getArtistIdentifier(artist.name) as string).toString()
				};
			})).filter((id): id is Exclude<typeof id, undefined> => id !== undefined);

			newIds.forEach((id) =>
				this.logger.verbose(`External ID from ${id.providerName} found for artist ${artist.name}`));
			await this.prismaService.artistExternalId.createMany({
				data: newIds.map(({ providerName, ...id }) => id),
				skipDuplicates: true
			});
		}
	}
}
