import { Injectable, Logger } from '@nestjs/common';
import { AlbumService } from 'src/album/album.service';
import { Slug } from 'src/slug/slug';
import { Release, Artist, Album, Prisma } from '@prisma/client';
import { MasterReleaseNotFoundException, MasterReleaseNotFoundFromIDException, ReleaseAlreadyExists, ReleaseNotFoundException, ReleaseNotFoundFromIDException } from './release.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReleaseRelationInclude, ReleasesWhereInput, ReleaseWhereInput } from './models/release.query-parameters';
import { AlbumQueryParameters } from 'src/album/models/album.query-parameters';
import { ArtistQueryParameters } from 'src/artist/models/artist.query-parameters';

@Injectable()
export class ReleaseService {
	constructor(
		private prismaService: PrismaService,
		private albumService: AlbumService,
	) {}

	/**
	 * Find a release
	 * @param where the query parameters to find the release
	 * @param include the relation fields to include
	 * @returns a release. Throws if not found
	 */
	async getRelease(where: ReleaseWhereInput, include?: ReleaseRelationInclude) {
		const artistSlug = where.byMasterOfNamedAlbum?.artistSlug ?? where.bySlug?.artistSlug
		const albumSlug = where.byMasterOfNamedAlbum?.albumSlug ?? where.bySlug?.albumSlug
		const findMaster = where.byMasterOf || where.byMasterOfNamedAlbum
		try {
			return await this.prismaService.release.findFirst({
				rejectOnNotFound: true,
				where: {
					id: where.byId?.id,
					master: findMaster ? true : undefined,
					slug: where.bySlug?.slug.toString(),
					album: where.byId == undefined ? {
						id: where.byMasterOf?.albumId,
						slug: albumSlug?.toString(),
						artist: artistSlug ? {
							slug: artistSlug.toString()
						} : null
					} : undefined
				},
				include: {
					album: include?.album ?? false,
					tracks: include?.tracks ?? false
				}
			});
		} catch {
			if (where.byId) {
				throw new ReleaseNotFoundFromIDException(where.byId.id);
			} else if (where.bySlug) {
				throw new ReleaseNotFoundException(
					where.bySlug.slug,
					where.bySlug.albumSlug,
					where.bySlug.artistSlug
				);
			} else if (where.byMasterOfNamedAlbum) {
				throw new MasterReleaseNotFoundException(
					where.byMasterOfNamedAlbum.albumSlug,
					where.byMasterOfNamedAlbum.artistSlug
				);
			}
			throw new MasterReleaseNotFoundFromIDException(where.byMasterOf.albumId);
		}
	};

	/**
	 * Find releases
	 * @param where the query parameters to find the releases
	 * @param include the relation fields to includes
	 * @returns an array of releases
	 */
	async getReleases(where: ReleasesWhereInput, include?: ReleaseRelationInclude) {
		return await this.prismaService.release.findMany({
			where: this.buildQueryParametersForMany(where),
			include: {
				album: include?.album ?? false,
				tracks: include?.tracks ?? false
			}
		});
	}

	async getAlbumReleases(where: AlbumQueryParameters.WhereInput, include?: ReleaseRelationInclude) {
		return await this.getReleases({
			album: where.byId
				? { byId: { id: where.byId.id } }
				: { bySlug: { slug: where.bySlug.slug, artist: where.bySlug.artist } }
			},
			include
		);
	}

	private buildQueryParametersForMany(where: ReleasesWhereInput) {
		return {
			album: {
				id: where.album.byId?.id,
				slug: where.album.bySlug?.slug.toString(),
				artist: where.album ?
					where.album.bySlug?.artist
						? ArtistQueryParameters.buildQueryParameters(where.album.bySlug.artist)
						: null
				: undefined
			}
		};
	}

	/**
	 * Count the artists that match the query parameters
	 * @param where the query parameters
	 */
	async countReleases(where: ReleasesWhereInput): Promise<number> {
		return (await this.prismaService.release.count({
			where: this.buildQueryParametersForMany(where)
		}));
	}

	/**
	 * Updates the release in the database
	 * @param release the release to update
	 */
	
	async updateRelease(release: Release) {
		let updatedRelease = await this.prismaService.release.update({
			data: {
				...release,
				slug: new Slug(release.title).toString(),
				album: undefined,
				tracks: undefined
			},
			where: {
				id: release.id
			}
		});
		if (release.master) {
		 	await this.setReleaseAsMaster(updatedRelease);
		} else {
		 	await this.unsetReleaseAsMaster(updatedRelease);
		};
		await this.albumService.updateAlbumDate({ byId: { id: release.albumId }});
		return updatedRelease;
	}

	/**
	 * Finds a release, or creates one if it does not exist already
	 * @param releaseTitle the title of the release
	 * @param albumName  the name of the parent album, if null, will take the release name without its extension
	 * @param artistName the name of the album artist, if it has one
	 * @param releaseDate the release date of the release, only used for creation
	 * @param include the relation fields to include on returned value
	 * @returns 
	 */
	async findOrCreateRelease(releaseTitle: string, albumName?: string, artistName?: string, releaseDate?: Date, include?: ReleaseRelationInclude) {
		let artistSlug: Slug | undefined = artistName ? new Slug(artistName) : undefined;
		albumName = albumName ?? this.removeReleaseExtension(releaseTitle);
		try {
			return await this.getRelease(
				{ bySlug: { slug: new Slug(releaseTitle), albumSlug: new Slug(albumName), artistSlug: artistSlug } },
				include
			);
		} catch {
			let album = await this.albumService.getOrCreate({
				name: albumName,
				artist: artistSlug ? { slug: artistSlug } : undefined,
			}, { releases: true, artist: true });
			return await this.createRelease(releaseTitle, album, releaseDate, include);
		}
	}

	/**
	 * Sets provided release as the album's master release, unsetting other master from the same album
	 * @param release 
	 */
	async setReleaseAsMaster(release: Release): Promise<Release> {
		let otherAlbumReleases: Release[] = (await this.getAlbumReleases({ byId: { id: release.albumId }}))
			.filter((albumRelease) => albumRelease.id != release.id);
		
		await this.prismaService.release.updateMany({
			data: {
				master: false
			},
			where: {
				id: {
					in: otherAlbumReleases.map((albumRelease) => albumRelease.id)
				}
			}
		});
		return await this.prismaService.release.update({
			data: {
				master: false
			},
			where: {
				id: release.id
			}
		});
	}

	/**
	 * Unsets provided release as the album's master release, setting next release as the master
	 * If the release is the only one from the album, it will not bet unset
	 * @param release 
	 */
	 async unsetReleaseAsMaster(release: Release): Promise<Release> {
		let otherAlbumReleases: Release[] = (await this.getAlbumReleases({ byId: { id: release.albumId }}))
			.filter((albumRelease) => albumRelease.id != release.id);
		if (otherAlbumReleases.find((albumRelease) => albumRelease.master))
			return release;
		if (otherAlbumReleases.length == 0)
			return release;
		await this.prismaService.release.update({
			data: {
				master: true
			},
			where: {
				id: otherAlbumReleases.at(0)!.id
			}
		});
		return await this.prismaService.release.update({
			data: {
				master: false
			},
			where: {
				id: release.id
			}
		});
	}


	async createRelease(releaseTitle: string, album: Album & { releases: Release[], artist: Artist | null}, releaseDate?: Date, include?: Prisma.ReleaseInclude) {
		const releaseSlug = new Slug(releaseTitle);
		try {
			let release = await this.prismaService.release.create({
				data: {
					albumId: album.id,
					releaseDate: releaseDate,
					master: album.releases.filter((release) => release.master).length == 0,
					title: releaseTitle,
					slug: releaseSlug.toString()
				},
				include: {
					album: include?.album ?? false,
					tracks: include?.tracks ?? false
				}
			});
			let updatedAlbum = await this.albumService.updateAlbumDate({ byId: { id: release.albumId } });
			if (include?.album ?? false)
				release.album = updatedAlbum;
			return release;
		} catch {
			throw new ReleaseAlreadyExists(releaseSlug, album.artist ? new Slug(album.artist!.slug!) : undefined);
		}
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

	/**
	 * Deletes a release using its ID
	 * Also delete related tracks.
	 * @param releaseId 
	 */
	async deleteRelease(releaseId: number): Promise<void> {
		try {
			let deletedRelease = await this.prismaService.release.delete({
				where: {
					id: releaseId
				}
			});
			this.albumService.deleteAlbumIfEmpty(deletedRelease.albumId);
		} catch {
			throw new ReleaseNotFoundFromIDException(releaseId);
		}
	}

	/**
	 * Deletes a release if it does not have related tracks
	 * @param songId 
	 */
	async deleteReleaseIfEmpty(songId: number): Promise<void> {
		const trackCount = await this.prismaService.track.count({
			where: {
				songId: songId
			}
		});
		if (trackCount == 0)
			await this.deleteRelease(songId);
	}
}
