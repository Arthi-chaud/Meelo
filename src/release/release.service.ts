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
					album: include?.album,
					tracks: include?.tracks
				}
			});
		} catch {
			throw new MasterReleaseNotFoundException(albumSlug, artistSlug);
		}
	}
	
	async updateRelease(release: Release) {
		return await this.prismaService.release.update({
			data: {...release, album: undefined, tracks: undefined},
			where: {
				id: release.id
			}
		});
	}

	async findOrCreateRelease(releaseTitle: string, albumName: string, artistName?: string, include?: Prisma.ReleaseInclude) {
		try {
			return await this.getRelease(releaseTitle, new Slug(albumName), artistName ? new Slug(artistName) : undefined);
		} catch {
			let album = await this.albumService.findOrCreate(albumName, artistName, { releases: true, artist: true });
			return await this.createRelease(releaseTitle, album, include);
		}
	}


	async createRelease(releaseTitle: string, album: Album & {releases: Release[], artist: Artist | null}, include?: Prisma.ReleaseInclude) {
		try {
			return await this.prismaService.release.create({
				data: {
					albumId: album.id,
					master: album.releases.filter((release) => release.master).length == 0,
					title: releaseTitle,
				},
				include: {
					album: include?.album,
					tracks: include?.tracks
				}
			});
		} catch {
			throw new ReleaseAlreadyExists(releaseTitle, album.artist ? new Slug(album.artist!.slug!) : undefined);
		}
	}
	
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
							equals: artistSlug?.toString()
						}
					}
				},
				include: {
					album: include?.album,
					tracks: include?.tracks
				}
			});
		} catch {
			throw new ReleaseNotFoundException(releaseTitle, albumSlug, artistSlug);
		}
	}
}
