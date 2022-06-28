import { Injectable, Logger } from '@nestjs/common';
import { AlbumService } from 'src/album/album.service';
import { Slug } from 'src/slug/slug';
import { Release, Artist, Album } from '@prisma/client';
import { MasterReleaseNotFoundException, MasterReleaseNotFoundFromIDException, ReleaseAlreadyExists, ReleaseNotFoundException, ReleaseNotFoundFromIDException } from './release.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReleaseQueryParameters } from './models/release.query-parameters';
import { AlbumQueryParameters } from 'src/album/models/album.query-parameters';
import { ArtistQueryParameters } from 'src/artist/models/artist.query-parameters';
import { buildPaginationParameters, PaginationParameters } from 'src/utils/pagination';
import { MeeloException } from 'src/exceptions/meelo-exception';

@Injectable()
export class ReleaseService {
	constructor(
		private prismaService: PrismaService,
		private albumService: AlbumService,
	) {}

	/**
	 * Create a Release in the database
	 * @param release the parameters needed to create the release
	 * @param include the relation fields to inclide in the returned object
	 * @returns the created release
	 */
	async createRelease(release: ReleaseQueryParameters.CreateInput, include?: ReleaseQueryParameters.RelationInclude) {
		const releaseSlug = new Slug(release.title);
		try {
			let createdRelease = await this.prismaService.release.create({
				data: {
					title: release.title,
					releaseDate: release.releaseDate,
					master: release.master,
					albumId: release.albumId,
					slug: releaseSlug.toString()
				},
				include: ReleaseQueryParameters.buildIncludeParameters(include)
			});
			let updatedAlbum = await this.albumService.updateAlbumDate({ byId: { id: createdRelease.albumId } });
			if (include?.album ?? false)
				createdRelease.album = updatedAlbum;
			return createdRelease;
		} catch {
			const parentAlbum = await this.albumService.getAlbum({ byId: { id: release.albumId }});
			throw new ReleaseAlreadyExists(releaseSlug, parentAlbum.artist ? new Slug(parentAlbum.artist!.slug!) : undefined);
		}
	}

	/**
	 * Find a release
	 * @param where the query parameters to find the release
	 * @param include the relation fields to include
	 * @returns a release. Throws if not found
	 */
	async getRelease(where: ReleaseQueryParameters.WhereInput, include?: ReleaseQueryParameters.RelationInclude) {
		try {
			return await this.prismaService.release.findFirst({
				rejectOnNotFound: true,
				where: ReleaseQueryParameters.buildQueryParameterForOne(where),
				include: ReleaseQueryParameters.buildIncludeParameters(include)
			});
		} catch {
			throw await this.getReleaseNotFoundError(where);
		}
	};

	/**
	 * Find releases
	 * @param where the query parameters to find the releases
	 * @param include the relation fields to includes
	 * @returns an array of releases
	 */
	async getReleases(where: ReleaseQueryParameters.ManyWhereInput, pagination?: PaginationParameters, include?: ReleaseQueryParameters.RelationInclude) {
		return await this.prismaService.release.findMany({
			where: ReleaseQueryParameters.buildQueryParametersForMany(where),
			include: ReleaseQueryParameters.buildIncludeParameters(include),
			...buildPaginationParameters(pagination)
		});
	}

	/**
	 * Fetch the releases from an album
	 * @param where the parameters to find the parent album
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned filed
	 * @returns 
	 */
	async getAlbumReleases(where: AlbumQueryParameters.WhereInput, pagination?: PaginationParameters, include?: ReleaseQueryParameters.RelationInclude) {
		return await this.getReleases(
			{ album: where },
			pagination,
			include
		);
	}

	/**
	 * Count the artists that match the query parameters
	 * @param where the query parameters
	 */
	async countReleases(where: ReleaseQueryParameters.ManyWhereInput): Promise<number> {
		return (await this.prismaService.release.count({
			where: ReleaseQueryParameters.buildQueryParametersForMany(where)
		}));
	}

	/**
	 * Updates the release in the database
	 * @param what the fields to update in the release
	 * @param where the query parameters to fin the release to update
	 */
	
	 async updateRelease(what: ReleaseQueryParameters.UpdateInput, where: ReleaseQueryParameters.WhereInput) {
		let updatedRelease = await this.prismaService.release.update({
			data: {
				title: what.title,
				releaseDate: what.releaseDate,
				master: what.master,
				albumId: what.albumId,
				slug: what.title ? new Slug(what.title).toString() : undefined,
			},
			where: ReleaseQueryParameters.buildQueryParameterForOne(where),
		});
		if (what.master) {
		 	await this.setReleaseAsMaster(updatedRelease);
		} else  if (what.master === false) {
		 	await this.unsetReleaseAsMaster(updatedRelease);
		};
		await this.albumService.updateAlbumDate({ byId: { id: updatedRelease.albumId }});
		return updatedRelease;
	}


	/**
	 * Deletes a release using its ID
	 * Also delete related tracks.
	 * @param where Query parameters to find the release to update 
	 */
	 async deleteRelease(where: ReleaseQueryParameters.WhereInput): Promise<void> {
		try {
			let deletedRelease = await this.prismaService.release.delete({
				where: ReleaseQueryParameters.buildQueryParameterForOne(where),
			});
			if (deletedRelease.master)
				this.unsetReleaseAsMaster(deletedRelease);
			this.albumService.deleteAlbumIfEmpty(deletedRelease.albumId);
		} catch {
			throw await this.getReleaseNotFoundError(where);
		}
	}

	/**
	 * Deletes a release if it does not have related tracks
	 * @param where the query parameters to find the track to delete 
	 */
	async deleteReleaseIfEmpty(where: ReleaseQueryParameters.WhereInput): Promise<void> {
		const trackCount = await this.prismaService.track.count({
			where: {
				release: ReleaseQueryParameters.buildQueryParameterForOne(where)
			}
		});
		if (trackCount == 0)
			await this.deleteRelease(where);
	}

	/**
	 * Finds a release, or creates one if it does not exist already
	 * @param where where the query parameters to fond or create the release
	 * @returns the fetched or createdrelease
	 */
	async getOrCreateRelease(where: ReleaseQueryParameters.GetOrCreateInput, include?: ReleaseQueryParameters.RelationInclude) {
		try {
			return await this.getRelease(
				{ bySlug: { slug: new Slug(where.title), album: { byId: { id: where.albumId } }}},
				include
			);
		} catch {
			return await this.createRelease(where, include);
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
	 * @param where release the query parameters to find the release to et as master
	 */
	async setReleaseAsMaster(where: ReleaseQueryParameters.UpdateAlbumMaster): Promise<void> {
		let otherAlbumReleases: Release[] = (await this.getAlbumReleases({ byId: { id: where.albumId }}))
			.filter((albumRelease) => albumRelease.id != where.id);
		
		await Promise.allSettled([
			this.prismaService.release.updateMany({
				data: { master: false },
				where: {
					id: {
						in: otherAlbumReleases.map((albumRelease) => albumRelease.id)
					}
				}
			}),
			this.prismaService.release.update({
				data: { master: true },
				where: ReleaseQueryParameters.buildQueryParameterForOne({ byId: { id: where.albumId }})
			})
		]);
	}

	/**
	 * Unsets provided release as the album's master release, setting another release a master of the album
	 * @param where the query parameters to find the release to et as master
	 */
	 async unsetReleaseAsMaster(where: ReleaseQueryParameters.UpdateAlbumMaster): Promise<void> {
		let otherAlbumReleases: Release[] = (await this.getAlbumReleases({ byId: { id: where.albumId }}))
			.filter((albumRelease) => albumRelease.id != where.id);
		if (otherAlbumReleases.find((albumRelease) => albumRelease.master))
			return;
		if (otherAlbumReleases.length == 0)
			return;
		await Promise.allSettled([
			this.prismaService.release.update({
				data: { master: true },
				where: ReleaseQueryParameters.buildQueryParameterForOne({ byId: { id: otherAlbumReleases.at(0)!.id }})
			}),
			this.prismaService.release.update({
				data: { master: false },
				where: ReleaseQueryParameters.buildQueryParameterForOne({ byId: { id: where.id }})
			}),
		]);
	}

	
	/**
	 * Extract an extension from a release name
	 * For example, if the release Name is 'My Album (Deluxe Edition)', it would return
	 * '(Deluxe Edition)'
	 * @param releaseName 
	 */
	extractReleaseExtension(releaseName: string): string | null {
		const delimiters = [
			['(', ')'],
			['{', '}'],
			['[', ']']
		];
		const extensionKeywords = [
			'Edition',
			'Version',
			'Reissue',
			'Deluxe',
			'Standard',
			'Edited',
			'Explicit'
		];
		const extensionsGroup = extensionKeywords.map((ext) => `(${ext})`).join('|');
		for (const delimiter of delimiters) {
			const regExp = `\\s+(?<extension>\\${delimiter[0]}.*(${extensionsGroup}).*\\${delimiter[1]})`;
			let match = releaseName.match(regExp);
			if (match)
				return match[1];
		}
		return null;
	}

	/**
	 * Removes an extension from a release's name
	 * For example, if the release Name is 'My Album (Deluxe Edition)', the parent
	 * album name would be 'My Album'
	 */
	removeReleaseExtension(releaseName: string): string {
		const extension: string | null = this.extractReleaseExtension(releaseName);
		if (extension !== null) {
			return releaseName.replace(extension, "").trim();
		}
		return releaseName;
	}
}
