/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Inject, Injectable, forwardRef } from "@nestjs/common";
import PrismaService from "src/prisma/prisma.service";
import ProviderService from "./provider.service";
import Logger from "src/logger/logger";
import IProvider from "./iprovider";
import { Artist } from "src/prisma/models";
import ExternalId from "./models/external-id";
import MusicBrainzProvider from "./musicbrainz/musicbrainz.provider";
import { isFulfilled } from "src/utils/is-fulfilled";
import { isDefined } from "src/utils/is-undefined";
import { HttpService } from "@nestjs/axios";
import { Album, Song } from "@prisma/client";
import { IEntity, IRelation } from "musicbrainz-api";
import WikipediaProvider from "./wikipedia/wikipedia.provider";
import SettingsService from "src/settings/settings.service";
import GenreService from "src/genre/genre.service";

type ExternalIds = { externalIds: ExternalId[] };

@Injectable()
export default class ExternalIdService {
	private readonly logger: Logger = new Logger(ExternalIdService.name);
	constructor(
		private prismaService: PrismaService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => GenreService))
		private genreService: GenreService,
		private readonly httpService: HttpService,
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
	) {}

	/**
	 * Fetch & registers missing External IDs for artists
	 */
	public async fetchArtistsExternalIds() {
		const artists = await this.prismaService.artist.findMany({
			include: { externalIds: true },
		});

		for (const artist of artists) {
			await this.fetchArtistExternalIds(artist).catch(() => {});
		}
	}

	private async fetchArtistExternalIds(
		artist: Artist & { externalIds: ExternalId[] },
	) {
		return this.fetchResourceExternalIds(
			artist,
			(provider, mbid) => provider.getArtistMetadataByIdentifier(mbid),
			(provider) => provider.getArtistMetadataByName(artist.name),
			(provider, mbid) => provider.getArtistEntry(mbid),
			(provider) => provider.getArtistWikidataIdentifierProperty(),
			({ value, description }, providerId) => ({
				value,
				description,
				artistId: artist.id,
				providerId,
			}),
			(ids) =>
				this.prismaService.artistExternalId.createMany({
					data: ids,
					skipDuplicates: true,
				}),
		);
	}

	/**
	 * Fetch & registers missing External IDs for albums
	 */
	public async fetchAlbumsExternalIds() {
		const albums = await this.prismaService.album.findMany({
			include: {
				externalIds: true,
				artist: { include: { externalIds: true } },
			},
		});

		for (const album of albums) {
			await this.fetchAlbumExternalIds(album).catch(() => {});
		}
	}

	private async fetchAlbumExternalIds(
		album: Album & { artist?: (Artist & ExternalIds) | null } & ExternalIds,
	) {
		return this.fetchResourceExternalIds(
			album,
			(provider, mbid) => provider.getAlbumMetadataByIdentifier(mbid),
			(provider, providerId) => {
				if (!album.artist) {
					return provider.getAlbumMetadataByName(album.name);
				}
				const parentArtistIdentifier = album.artist.externalIds.find(
					(externalId) => externalId.providerId == providerId,
				)!.value;

				return provider.getAlbumMetadataByName(
					album.name,
					parentArtistIdentifier,
				);
			},
			(provider, mbid) => provider.getAlbumEntry(mbid),
			(provider) => provider.getAlbumWikidataIdentifierProperty(),
			({ value, description, rating, genres }, providerId) => ({
				value,
				description,
				rating,
				genres,
				albumId: album.id,
				providerId,
			}),
			async (ids) => {
				const newGenres = ids
					.map(({ genres }) => genres)
					.filter((genres) => genres != undefined)
					.flat()
					.map((genre) =>
						this.genreService.formatCreateInput({ name: genre! }),
					);

				if (
					this.settingsService.settingsValues.metadata
						.useExternalProviderGenres &&
					newGenres.length > 0
				) {
					await this.prismaService.album.update({
						where: { id: album.id },
						data: {
							genres: {
								connectOrCreate: newGenres.map((genre) => ({
									where: { slug: genre.slug },
									create: genre,
								})),
							},
						},
					});
				}
				return this.prismaService.albumExternalId.createMany({
					data: ids.map(({ genres, ...id }) => id),
					skipDuplicates: true,
				});
			},
		);
	}

	/**
	 * Fetch & registers missing External IDs for songs
	 */
	public async fetchSongsExternalIds() {
		const songs = await this.prismaService.song.findMany({
			include: {
				externalIds: true,
				artist: { include: { externalIds: true } },
			},
		});

		for (const song of songs) {
			await this.fetchSongExternalIds(song).catch(() => {});
		}
	}

	private async fetchSongExternalIds(
		song: Song & { artist: Artist & ExternalIds } & ExternalIds,
	) {
		return this.fetchResourceExternalIds(
			song,
			(provider, mbid) => provider.getSongMetadataByIdentifier(mbid),
			(provider, providerId) => {
				const parentArtistIdentifier = song.artist.externalIds.find(
					(externalId) => externalId.providerId == providerId,
				)!.value;

				return provider.getSongMetadataByName(
					song.name,
					parentArtistIdentifier,
				);
			},
			(provider, mbid) => provider.getSongEntry(mbid),
			(provider) => provider.getSongWikidataIdentifierProperty(),
			({ value, description }, providerId) => ({
				value,
				description,
				songId: song.id,
				providerId,
			}),
			(ids) =>
				this.prismaService.songExternalId.createMany({
					data: ids,
					skipDuplicates: true,
				}),
		);
	}

	/**
	 * Core function of the metadata fetching flow
	 * @param resource the resource which we should fetch the metadata of
	 * @param getResourceMetadataByIdentifier a function which a provider and an identifier, and returns the related metadata
	 * @param getResourceMetadataByName  a function which a provider and the resource's namme, and returns the related metadata
	 * @param getResourceMusicBrainzEntry a function that returns the Musicbrainz resource's entry
	 * @param getResourceWikidataIdentifierProperty a function that returns the identifier of the related wikidata property (e.g. `P1234`)
	 * @param formatResourceMetadata takes a identifier, a description the provider's ID, and returns everything that is needed to create a row in the database
	 * @param saveExternalIds a functions which should persist the array of external IDs passed by parameters
	 * @returns an empty promise
	 */
	private async fetchResourceExternalIds<
		Resource extends { id: number; name: string },
		MBIDEntry extends IEntity & { relations?: IRelation[] },
		ExternalID extends Omit<ExternalId, "id">,
		Metadata extends Omit<ExternalID, "providerId">,
	>(
		resource: Resource & ExternalIds,
		getResourceMetadataByIdentifier: (
			provider: IProvider,
			id: string,
		) => Promise<Metadata>,
		getResourceMetadataByName: (
			provider: IProvider,
			providerId: number,
		) => Promise<Metadata>,
		getResourceMusicBrainzEntry: (
			provider: MusicBrainzProvider,
			id: string,
		) => Promise<MBIDEntry>,
		getResourceWikidataIdentifierProperty: (
			provider: IProvider,
		) => string | null,
		formatResourceMetadata: (
			metadata: Metadata,
			providerId: number,
		) => ExternalID,
		saveExternalIds: (externalIds: ExternalID[]) => Promise<unknown>,
	) {
		const enabledProviders = this.providerService.enabledProviders;
		const musicbrainzProvider = enabledProviders.find(
			({ name }) => name == "musicbrainz",
		) as MusicBrainzProvider | undefined;
		const wikipediaProvider = enabledProviders.find(
			({ name }) => name == "wikipedia",
		) as WikipediaProvider | undefined;
		const otherProviders = enabledProviders.filter(
			(provider) =>
				provider.name !== musicbrainzProvider?.name &&
				provider.name !== wikipediaProvider?.name,
		);
		let providersToReach = otherProviders;
		const musicbrainzId = musicbrainzProvider
			? this.providerService.getProviderId(musicbrainzProvider.name)
			: null;
		const wikipediaProviderId = wikipediaProvider
			? this.providerService.getProviderId(wikipediaProvider.name)
			: null;
		let resourceMBID = resource.externalIds.find(
			({ providerId }) => providerId == musicbrainzId,
		) as Metadata | undefined;
		const resourceWikipediaId = resource.externalIds.find(
			({ providerId }) => providerId == wikipediaProviderId,
		);
		const newIdentifiers: ExternalID[] = [];

		if (musicbrainzProvider && musicbrainzId) {
			// If MB is enabled
			try {
				if (!resourceMBID) {
					resourceMBID = await getResourceMetadataByName(
						musicbrainzProvider,
						musicbrainzId,
					);
					newIdentifiers.push(
						formatResourceMetadata(resourceMBID, musicbrainzId),
					);
				}
				const resourceEntry = await getResourceMusicBrainzEntry(
					musicbrainzProvider,
					resourceMBID.value,
				);
				const wikiDataId = resourceEntry.relations
					?.map(
						({ url }) =>
							url?.resource?.match(
								/(https:\/\/www\.)?wikidata\.org\/wiki\/(?<ID>Q\d+)/,
							)?.groups?.["ID"],
					)
					.filter((match) => match !== undefined)
					.at(0);

				if (wikiDataId) {
					const resourceIdentifiers = await this.httpService.axiosRef
						.get(
							"/w/rest.php/wikibase/v0/entities/items/" +
								wikiDataId,
							{ baseURL: "https://wikidata.org" },
						)
						.then(({ data }) => data["statements"])
						.catch(() => null);
					const identifiers = await Promise.allSettled([
						...(wikipediaProviderId && !resourceWikipediaId
							? [
									wikipediaProvider
										?.getResourceMetadataByWikidataId(
											wikiDataId,
										)
										?.then((metadata) =>
											formatResourceMetadata(
												metadata as Metadata,
												wikipediaProviderId,
											),
										),
							  ]
							: []),
						...otherProviders.map(async (provider) => {
							const providerId =
								this.providerService.getProviderId(
									provider.name,
								);
							const externalId = resource.externalIds.find(
								(id) => id.providerId == providerId,
							);
							const providerProperyIdentifier =
								getResourceWikidataIdentifierProperty(provider);

							if (externalId || !providerProperyIdentifier) {
								return;
							}
							providersToReach = providersToReach.filter(
								(toReach) => toReach.name !== provider.name,
							);
							return formatResourceMetadata(
								await getResourceMetadataByIdentifier(
									provider,
									resourceIdentifiers[
										providerProperyIdentifier
									]
										.at(0)
										?.value?.content.toString(),
								),
								providerId,
							);
						}),
					]);

					newIdentifiers.push(
						...identifiers
							.filter(isFulfilled)
							.map(({ value }) => value)
							.filter(isDefined),
					);
				}
			} catch {
				// Fallback, nothing to do
			}
		}
		const fetchedIdentifiers = await Promise.allSettled(
			providersToReach.map(async (provider) => {
				const providerId = this.providerService.getProviderId(
					provider.name,
				);
				const externalId = resource.externalIds.find(
					(id) => id.providerId == providerId,
				);

				if (externalId) {
					return;
				}
				return formatResourceMetadata(
					await getResourceMetadataByName(provider, providerId),
					providerId,
				);
			}),
		);

		newIdentifiers.push(
			...fetchedIdentifiers
				.filter(isFulfilled)
				.map(({ value }) => value)
				.filter(isDefined),
		);
		newIdentifiers.forEach((identifier) => {
			this.logger.verbose(
				`External ID from ${
					this.providerService.getProviderById(identifier.providerId)
						.name
				} found for ${resource.name}.`,
			);
		});
		return saveExternalIds(newIdentifiers);
	}
}
