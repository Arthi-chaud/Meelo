import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import Slug from 'src/slug/slug';
import type { Album, Release, Track } from '@prisma/client';
import { MasterReleaseNotFoundFromIDException, ReleaseAlreadyExists, ReleaseNotFoundException, ReleaseNotFoundFromIDException } from './release.exceptions';
import PrismaService from 'src/prisma/prisma.service';
import ReleaseQueryParameters from './models/release.query-parameters';
import AlbumQueryParameters from 'src/album/models/album.query-parameters';
import { type PaginationParameters, buildPaginationParameters } from 'src/pagination/models/pagination-parameters';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import ReleaseController from './release.controller';
import { UrlGeneratorService } from 'nestjs-url-generator';
import TrackService from 'src/track/track.service';
import { buildSortingParameter } from 'src/sort/models/sorting-parameter';

@Injectable()
export default class ReleaseService {
	constructor(
		private prismaService: PrismaService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		private readonly urlGeneratorService: UrlGeneratorService
	) {}

	/**
	 * Create a Release in the database
	 * @param release the parameters needed to create the release
	 * @param include the relation fields to inclide in the returned object
	 * @returns the created release
	 */
	async createRelease(
		release: ReleaseQueryParameters.CreateInput,
		include?: ReleaseQueryParameters.RelationInclude
	) {
		const releaseSlug = new Slug(release.title);
		try {
			let createdRelease = await this.prismaService.release.create({
				data: {
					title: release.title,
					releaseDate: release.releaseDate,
					master: release.master,
					album: {
						connect: AlbumQueryParameters.buildQueryParametersForOne(release.album),
					},
					slug: releaseSlug.toString()
				},
				include: ReleaseQueryParameters.buildIncludeParameters(include)
			});
			let updatedAlbum = await this.albumService.updateAlbumDate({ byId: { id: createdRelease.albumId } });
			if (include?.album ?? false)
				createdRelease.album = updatedAlbum;
			return createdRelease;
		} catch {
			const parentAlbum = await this.albumService.getAlbum(release.album);
			throw new ReleaseAlreadyExists(releaseSlug, parentAlbum.artist ? new Slug(parentAlbum.artist!.slug) : undefined);
		}
	}

	/**
	 * Find a release
	 * @param where the query parameters to find the release
	 * @param include the relation fields to include
	 * @returns a release. Throws if not found
	 */
	async getRelease(
		where: ReleaseQueryParameters.WhereInput,
		include?: ReleaseQueryParameters.RelationInclude
	) {
		try {
			return await this.prismaService.release.findFirst({
				rejectOnNotFound: true,
				where: ReleaseQueryParameters.buildQueryParametersForOne(where),
				include: ReleaseQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw await this.getReleaseNotFoundError(where);
		}
	}

	/**
	 * Find releases
	 * @param where the query parameters to find the releases
	 * @param include the relation fields to includes
	 * @returns an array of releases
	 */
	async getReleases(
		where: ReleaseQueryParameters.ManyWhereInput,
		pagination?: PaginationParameters,
		include?: ReleaseQueryParameters.RelationInclude,
		sort?: ReleaseQueryParameters.SortingParameter
	) {
		return this.prismaService.release.findMany({
			where: ReleaseQueryParameters.buildQueryParametersForMany(where),
			include: ReleaseQueryParameters.buildIncludeParameters(include),
			orderBy: buildSortingParameter(sort),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Fetch the releases from an album
	 * @param where the parameters to find the parent album
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned objects
	 * @returns 
	 */
	async getAlbumReleases(
		where: AlbumQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: ReleaseQueryParameters.RelationInclude,
		sort?: ReleaseQueryParameters.SortingParameter
	) {
		const releases = await this.getReleases(
			{ album: where },
			pagination,
			include,
			sort
		);
		if (releases.length == 0) {
			await this.albumService.getAlbum(where);
		}
		return releases;
	}

	/**
	 * Fetch the master release of an album
	 * @param where the parameters to find the parent album
	 * @param include the relation to include in the returned objects
	 * @returns 
	 */
	async getMasterRelease(
		where: AlbumQueryParameters.WhereInput,
		include?: ReleaseQueryParameters.RelationInclude
	) {
		return this.getRelease({ byMasterOf: where }, include);
	}

	/**
	 * Count the artists that match the query parameters
	 * @param where the query parameters
	 */
	async countReleases(where: ReleaseQueryParameters.ManyWhereInput): Promise<number> {
		return this.prismaService.release.count({
			where: ReleaseQueryParameters.buildQueryParametersForMany(where)
		});
	}

	/**
	 * Updates the release in the database
	 * @param what the fields to update in the release
	 * @param where the query parameters to fin the release to update
	 */
	 async updateRelease(
		what: ReleaseQueryParameters.UpdateInput,
		where: ReleaseQueryParameters.WhereInput
	) {
		let unmodifiedRelease = await this.getRelease(where);
		let updatedRelease = await this.prismaService.release.update({
			data: {
				...what,
				album: what.album ? {
					connect: AlbumQueryParameters.buildQueryParametersForOne(what.album),
				} : undefined,
				slug: what.title ? new Slug(what.title).toString() : undefined,
			},
			where: ReleaseQueryParameters.buildQueryParametersForOne(where),
		});
		const masterChangeInput: ReleaseQueryParameters.UpdateAlbumMaster = {
			releaseId: updatedRelease.id,
			album: { byId: { id: updatedRelease.albumId } }
		};
		if (!unmodifiedRelease.master && what.master) {
		 	await this.setReleaseAsMaster(masterChangeInput);
		} else if (unmodifiedRelease.master && !what.master) {
		 	await this.unsetReleaseAsMaster(masterChangeInput);
		}
		await this.albumService.updateAlbumDate({ byId: { id: updatedRelease.albumId }});
		return updatedRelease;
	}


	/**
	 * Deletes a release
	 * Also delete related tracks.
	 * @param where Query parameters to find the release to delete 
	 */
	async deleteRelease(where: ReleaseQueryParameters.DeleteInput, deleteParent: boolean = true): Promise<void> {
		let release = await this.getRelease(where, { tracks: true });
		await Promise.allSettled(
			release.tracks.map((track) => this.trackService.deleteTrack({ id: track.id }, false))
		);
		try {
			await this.prismaService.release.delete({
				where: ReleaseQueryParameters.buildQueryParametersForOne(where),
			});
		} catch {
			return;
		}
		Logger.warn(`Release '${release.slug}' deleted`);
		if (release.master)
			await this.unsetReleaseAsMaster({
				releaseId: release.id,
				album: { byId: { id: release.albumId } }
			});
		if (deleteParent)
			await this.albumService.deleteAlbumIfEmpty(release.albumId);
	}

	/**
	 * Deletes a release if it does not have related tracks
	 * @param where the query parameters to find the track to delete 
	 */
	async deleteReleaseIfEmpty(where: ReleaseQueryParameters.DeleteInput): Promise<void> {
		const trackCount = await this.trackService.countTracks({ byRelease: where });
		if (trackCount == 0)
			await this.deleteRelease(where);
	}

	/**
	 * Finds a release, or creates one if it does not exist already
	 * @param where where the query parameters to fond or create the release
	 * @returns the fetched or createdrelease
	 */
	async getOrCreateRelease(
		where: ReleaseQueryParameters.GetOrCreateInput,
		include?: ReleaseQueryParameters.RelationInclude
	) {
		try {
			return await this.getRelease(
				{ bySlug: { slug: new Slug(where.title), album: where.album}},
				include
			);
		} catch {
			return this.createRelease(where, include);
		}
	}

	/**
	 * Callback on release not found
	 * @param where the query parameters that failed to get the release
	 */
	private async getReleaseNotFoundError(where: ReleaseQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.byId) {
			return new ReleaseNotFoundFromIDException(where.byId.id);
		} else if (where.byMasterOf?.byId) {
			return new MasterReleaseNotFoundFromIDException(where.byMasterOf.byId?.id);
		} else {
			const parentAlbum = await this.albumService.getAlbum(where.byMasterOf ?? where.bySlug.album, { artist: true });
			const releaseSlug: Slug = where.bySlug!.slug;
			const parentArtistSlug = parentAlbum.artist?.slug ? new Slug(parentAlbum.artist?.slug) : undefined
			return new ReleaseNotFoundException(releaseSlug, new Slug(parentAlbum.slug), parentArtistSlug);
		}
	}

	/**
	 * Sets provided release as the album's master release, unsetting other master from the same album
	 * @param where release the query parameters to find the release to set as master
	 */
	async setReleaseAsMaster(where: ReleaseQueryParameters.UpdateAlbumMaster): Promise<void> {
		let otherAlbumReleases: Release[] = (await this.getAlbumReleases(where.album))
			.filter((albumRelease) => albumRelease.id != where.releaseId);
		
		await Promise.allSettled([
			this.prismaService.release.updateMany({
				data: { master: false },
				where: {
					id: {
						in: otherAlbumReleases.map((albumRelease) => albumRelease.id)
					}
				}
			}),
			this.updateRelease(
				{ master: true },
				{ byId: { id: where.releaseId }}
			)
		]);
	}

	/**
	 * Unsets provided release as the album's master release, setting another release a master of the album
	 * @param where the query parameters to find the release to et as master
	 */
	async unsetReleaseAsMaster(where: ReleaseQueryParameters.UpdateAlbumMaster): Promise<void> {
		let otherAlbumReleases: Release[] = (await this.getAlbumReleases(where.album, {}, {}, { sortBy: 'id' }))
			.filter((albumRelease) => albumRelease.id != where.releaseId);
		if (otherAlbumReleases.find((albumRelease) => albumRelease.master))
			return;
		if (otherAlbumReleases.length == 0)
			return;
		await Promise.allSettled([
			this.updateRelease(
				{ master: true },
				{ byId: { id: otherAlbumReleases.at(0)!.id }}
			),
			this.updateRelease(
				{ master: false },
				{ byId: { id: where.releaseId }}
			)
		]);
	}

	buildReleaseResponse(release: Release & Partial<{ tracks: Track[], album: Album }>): Object {
		let response: Object = {
			...release,
			illustration: this.urlGeneratorService.generateUrlFromController({
				controller: ReleaseController,
				controllerMethod: ReleaseController.prototype.getReleaseIllustration,
				params: {
					idOrSlug: release.id.toString()
				}
			})
		};
		if (release.album !== undefined)
			response = {
				...response,
				album: this.albumService.buildAlbumResponse(release.album)
			}
		if (release.tracks !== undefined)
			response = {
				...response,
				tracks: release.tracks.map(
					(track) => this.trackService.buildTrackResponse(track)
				)
			}
		return response;
	}
}
