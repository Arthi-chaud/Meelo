import { Injectable, Logger } from '@nestjs/common';
import { AlbumService } from 'src/album/album.service';
import { Slug } from 'src/slug/slug';
import { Release, Track, Artist, Album } from '@prisma/client';
import { MasterReleaseNotFoundException, ReleaseAlreadyExists, ReleaseNotFoundException } from './release.exceptions';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ReleaseService {
	constructor(
		private prismaService: PrismaService,
		private albumService: AlbumService,
	) {}

	async getMasterReleaseOf(albumSlug: Slug, artistSlug?: Slug): Promise<Release> {
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
					album: true, 
					tracks: true
				}
			});
		} catch {
			throw new MasterReleaseNotFoundException(albumSlug, artistSlug);
		}
	}
	
	async saveRelease(release: Release): Promise<Release> {
		return await this.prismaService.release.create({
			data: {...release}
		});
	}

	async findOrCreateRelease(releaseTitle: string, albumName: string, artistName?: string): Promise<Release> {
		try {
			return await this.findRelease(releaseTitle, new Slug(albumName), artistName ? new Slug(artistName) : undefined);
		} catch {
			try {
				let album: Album = await this.albumService.findOrCreate(albumName, artistName);
				Logger.error(album.toJSON());
				Logger.error(album.releases);
				return await this.createRelease(releaseTitle, album);
			} catch (e) {
				Logger.warn(e);
				throw e;
			}
		}
	}


	async createRelease(releaseTitle: string, album: Album & {releases: Release[], artist: Artist}): Promise<Release> {
		try {
			return await this.prismaService.release.create({
				data: {
					albumId: album.id,
					master: album.releases.filter((release) => release.master).length == 0,
					title: releaseTitle,
				}
			});
		} catch {
			throw new ReleaseAlreadyExists(releaseTitle, album.artist ? new Slug(album.artist!.slug!) : undefined);
		}
	}
	
	async findRelease(releaseTitle: string, albumSlug: Slug, artistSlug?: Slug): Promise<Release> {
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
					album: true
				},
			});
		} catch {
			throw new ReleaseNotFoundException(releaseTitle, albumSlug, artistSlug);
		}
	}
}
