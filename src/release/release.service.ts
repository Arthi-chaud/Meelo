import { Injectable, Logger } from '@nestjs/common';
import { AlbumService } from 'src/album/album.service';
import { Slug } from 'src/slug/slug';
import { Release, Artist, Album, Prisma } from '@prisma/client';
import { MasterReleaseNotFoundException, ReleaseAlreadyExists, ReleaseNotFoundException } from './release.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReleaseService {
	constructor(
		private prismaService: PrismaService,
		private albumService: AlbumService,
	) {}

	async getMasterReleaseOf(albumSlug: Slug, artistSlug?: Slug, include?: Prisma.ReleaseInclude) {
		try {
			return await this.prismaService.release.findFirst({
				rejectOnNotFound: true,
				where: {
					master: true,
					album: {
						slug: {
							equals: albumSlug.toString()
						},
						artist: {
							slug: {
								equals: artistSlug?.toString()
							},
						}
					}
				},
				include: {
					album: include?.album ?? false,
					tracks: include?.tracks ?? false
				}
			});
		} catch {
			throw new MasterReleaseNotFoundException(albumSlug, artistSlug);
		}
	}
	
	async updateRelease(release: Release) {
		let updatedRelease = await this.prismaService.release.update({
			data: {...release, album: undefined, tracks: undefined},
			where: {
				id: release.id
			}
		});
		let parentAlbum = await this.albumService.getAlbumFromID(release.albumId);
		if (release.master) {
		 	await this.setReleaseAsMaster(updatedRelease);
		} else {
		 	await this.unsetReleaseAsMaster(updatedRelease);
		}
		await this.albumService.updateAlbumName(parentAlbum);
		await this.albumService.updateAlbumDate(parentAlbum);
		return updatedRelease;
	}

	/**
	 * Finds a release, or creates one if it does not exist already
	 * @param releaseTitle the title of the release
	 * @param albumName  the name of the parent album
	 * @param artistName the name of the album artist, if it has one
	 * @param releaseDate the release date of the release, only used for creation
	 * @param include the relation fields to include on returned value
	 * @returns 
	 */
	async findOrCreateRelease(releaseTitle: string, albumName: string, artistName?: string, releaseDate?: Date, include?: Prisma.ReleaseInclude) {
		let artistSlug: Slug | undefined = artistName ? new Slug(artistName) : undefined
		try {
			return await this.getRelease(releaseTitle, new Slug(albumName), artistSlug);
		} catch {
			let album: Album & { releases: Release[]; artist: Artist | null };
			try {
				album = await this.albumService.getCandidateAlbumFromReleaseName(releaseTitle, artistSlug, {
					releases: true, artist: true
				});
			} catch {
				album = await this.albumService.findOrCreate(albumName, artistName, { releases: true, artist: true });
			}
			return await this.createRelease(releaseTitle, album, releaseDate, include);
		}
	}

	/**
	 * Sets provided release as the album's master release, unsetting other master from the same album
	 * @param release 
	 */
	async setReleaseAsMaster(release: Release): Promise<Release> {
		let otherAlbumReleases: Release[] = (await this.albumService.getAlbumReleases(release.albumId))
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
		let otherAlbumReleases: Release[] = (await this.albumService.getAlbumReleases(release.albumId))
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
		try {
			let release = await this.prismaService.release.create({
				data: {
					albumId: album.id,
					releaseDate: releaseDate,
					master: album.releases.filter((release) => release.master).length == 0,
					title: releaseTitle,
				},
				include: {
					album: include?.album ?? false,
					tracks: include?.tracks ?? false
				}
			});
			await this.albumService.updateAlbumDate(album);
			release.album = await this.albumService.updateAlbumName(album);
			return release;
		} catch {
			throw new ReleaseAlreadyExists(releaseTitle, album.artist ? new Slug(album.artist!.slug!) : undefined);
		}
	}
	
	/**
	 * Retrives a release
	 * @param releaseTitle 
	 * @param albumSlug 
	 * @param artistSlug 
	 * @param include 
	 * @returns 
	 */
	async getRelease(releaseTitle: string, albumSlug: Slug, artistSlug?: Slug, include?: Prisma.ReleaseInclude) {
		try {
			return await this.prismaService.release.findFirst({
				rejectOnNotFound: true,
				where: {
					title: releaseTitle,
					album: {
						artist: {
							slug: {
								equals: artistSlug?.toString()
							}
						},
						slug: {
							equals: albumSlug?.toString()
						}
					}
				},
				include: {
					album: include?.album ?? false,
					tracks: include?.tracks ?? false
				}
			});
		} catch {
			throw new ReleaseNotFoundException(releaseTitle, albumSlug, artistSlug);
		}
	}
}
