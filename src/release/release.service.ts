import {
	Inject, Injectable, Logger, forwardRef
} from '@nestjs/common';
import AlbumService from 'src/album/album.service';
import Slug from 'src/slug/slug';
import type { Release, ReleaseWithRelations } from 'src/prisma/models';
import type { Prisma } from '@prisma/client';
import {
	MasterReleaseNotFoundFromIDException,
	ReleaseAlreadyExists,
	ReleaseNotFoundException,
	ReleaseNotFoundFromIDException
} from './release.exceptions';
import { basename } from 'path';
import PrismaService from 'src/prisma/prisma.service';
import type ReleaseQueryParameters from './models/release.query-parameters';
import type AlbumQueryParameters from 'src/album/models/album.query-parameters';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import TrackService from 'src/track/track.service';
import RepositoryService from 'src/repository/repository.service';
import IllustrationService from 'src/illustration/illustration.service';
import type { IllustrationPath } from 'src/illustration/models/illustration-path.model';
import { buildStringSearchParameters } from 'src/utils/search-string-input';
import ArtistService from 'src/artist/artist.service';
import { ReleaseResponse } from './models/release.response';
import SortingParameter from 'src/sort/models/sorting-parameter';
import FileService from 'src/file/file.service';
import archiver from 'archiver';
import { createReadStream } from 'fs';
import { Response } from 'express';
import mime from 'mime';

@Injectable()
export default class ReleaseService extends RepositoryService<
	ReleaseWithRelations,
	ReleaseQueryParameters.CreateInput,
	ReleaseQueryParameters.WhereInput,
	ReleaseQueryParameters.ManyWhereInput,
	ReleaseQueryParameters.UpdateInput,
	ReleaseQueryParameters.DeleteInput,
	ReleaseQueryParameters.SortingKeys,
	Prisma.ReleaseCreateInput,
	Prisma.ReleaseWhereInput,
	Prisma.ReleaseWhereInput,
	Prisma.ReleaseUpdateInput,
	Prisma.ReleaseWhereUniqueInput,
	Prisma.ReleaseOrderByWithRelationInput
> {
	constructor(
		protected prismaService: PrismaService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
	) {
		super(prismaService.release);
	}

	/**
	 * Create
	 */
	async create<I extends ReleaseQueryParameters.RelationInclude>(
		input: ReleaseQueryParameters.CreateInput, include?: I | undefined
	) {
		const release = await super.create(input, include);

		await this.albumService.updateAlbumDate({ id: release.albumId });
		const newMaster = await this.albumService.updateAlbumMaster({
			id: release.albumId
		});

		return { ...release, master: newMaster?.id == release.id };
	}

	formatCreateInput(release: ReleaseQueryParameters.CreateInput) {
		return {
			name: release.name,
			releaseDate: release.releaseDate,
			master: release.master,
			album: {
				connect: AlbumService.formatWhereInput(release.album),
			},
			slug: new Slug(release.name).toString()
		};
	}

	protected formatCreateInputToWhereInput(
		input: ReleaseQueryParameters.CreateInput
	): ReleaseQueryParameters.WhereInput {
		return { bySlug: { slug: new Slug(input.name), album: input.album } };
	}

	protected async onCreationFailure(input: ReleaseQueryParameters.CreateInput) {
		const parentAlbum = await this.albumService.get(input.album, { artist: true });

		return new ReleaseAlreadyExists(
			new Slug(input.name),
			parentAlbum.artist
				? new Slug(parentAlbum.artist!.slug)
				: undefined
		);
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: ReleaseQueryParameters.WhereInput) {
		return {
			id: where.id,
			master: where.masterOf ? true : undefined,
			slug: where.bySlug?.slug.toString(),
			album: where.masterOf
				? AlbumService.formatWhereInput(where.masterOf)
				: where.bySlug
					? AlbumService.formatWhereInput(where.bySlug.album)
					: undefined
		};
	}

	formatWhereInput = ReleaseService.formatWhereInput;
	static formatManyWhereInput(where: ReleaseQueryParameters.ManyWhereInput) {
		return {
			name: buildStringSearchParameters(where.name),
			album: where.album ? {
				id: where.album.id,
				slug: where.album.bySlug?.slug.toString(),
				artist: where.album.bySlug ?
					where.album.bySlug?.artist
						? ArtistService.formatWhereInput(where.album.bySlug.artist)
						: null
					: undefined
			} : undefined,
			tracks: where.library ? {
				some: TrackService.formatManyWhereInput({ library: where.library })
			} : undefined
		};
	}

	formatManyWhereInput = ReleaseService.formatManyWhereInput;

	formatSortingInput(
		sortingParameter: SortingParameter<ReleaseQueryParameters.SortingKeys>
	): Prisma.ReleaseOrderByWithRelationInput {
		switch (sortingParameter.sortBy) {
		case 'name':
			return { slug: sortingParameter.order };
		case 'trackCount':
			return { tracks: { _count: sortingParameter.order } };
		case 'addDate':
			return { id: sortingParameter.order };
		case 'releaseDate':
			return { releaseDate: { sort: sortingParameter.order, nulls: 'last' } };
		default:
			return { [sortingParameter.sortBy ?? 'id']: sortingParameter.order };
		}
	}

	/**
	 * Callback on release not found
	 * @param where the query parameters that failed to get the release
	 */
	async onNotFound(where: ReleaseQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.id != undefined) {
			return new ReleaseNotFoundFromIDException(where.id);
		} else if (where.masterOf?.id) {
			return new MasterReleaseNotFoundFromIDException(where.masterOf?.id);
		}
		const parentAlbum = await this.albumService.get(
			where.masterOf ?? where.bySlug.album, { artist: true }
		);
		const releaseSlug: Slug = where.bySlug!.slug;
		const parentArtistSlug = parentAlbum.artist?.slug
			? new Slug(parentAlbum.artist.slug)
			: undefined;

		return new ReleaseNotFoundException(
			releaseSlug, new Slug(parentAlbum.slug), parentArtistSlug
		);
	}

	/**
	 * Fetch the releases from an album
	 * @param where the parameters to find the parent album
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned objects
	 * @returns
	 */
	async getAlbumReleases<I extends ReleaseQueryParameters.RelationInclude>(
		where: AlbumQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: ReleaseQueryParameters.SortingParameter
	) {
		const releases = await super.getMany(
			{ album: where },
			pagination,
			include,
			sort
		);

		if (releases.length == 0) {
			await this.albumService.throwIfNotFound(where);
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
		return this.get({ masterOf: where }, include);
	}

	/**
	 * Update
	 */
	formatUpdateInput(what: ReleaseQueryParameters.UpdateInput): Prisma.ReleaseUpdateInput {
		return {
			...what,
			album: what.album ? {
				connect: AlbumService.formatWhereInput(what.album),
			} : undefined,
			slug: what.name ? new Slug(what.name).toString() : undefined,
		};
	}

	/**
	 * Updates the release in the database
	 * @param what the fields to update in the release
	 * @param where the query parameters to fin the release to update
	 */
	async update(
		what: ReleaseQueryParameters.UpdateInput,
		where: ReleaseQueryParameters.WhereInput
	) {
		const unmodifiedRelease = await this.get(where);
		const updatedRelease = await super.update(what, where);
		const masterChangeInput: ReleaseQueryParameters.UpdateAlbumMaster = {
			releaseId: updatedRelease.id,
			album: { id: updatedRelease.albumId }
		};

		if (!unmodifiedRelease.master && what.master === true) {
			await this.setReleaseAsMaster(masterChangeInput);
		} else if (unmodifiedRelease.master && what.master === false) {
			await this.unsetReleaseAsMaster(masterChangeInput);
		}
		await this.albumService.updateAlbumDate({ id: updatedRelease.albumId });
		return updatedRelease;
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: ReleaseQueryParameters.DeleteInput) {
		return this.formatWhereInput(where);
	}

	protected formatDeleteInputToWhereInput(input: ReleaseQueryParameters.DeleteInput) {
		return input;
	}

	/**
	 * Deletes a release
	 * Also delete related tracks.
	 * @param where Query parameters to find the release to delete
	 */
	async delete(where: ReleaseQueryParameters.DeleteInput, deleteParent = true): Promise<Release> {
		const release = await this.get(where, { tracks: true });

		await Promise.allSettled(
			release.tracks.map((track) => this.trackService.delete({ id: track.id }, false))
		);
		try {
			await super.delete(where);
		} catch {
			return release;
		}
		Logger.warn(`Release '${release.slug}' deleted`);
		if (release.master) {
			await this.albumService.updateAlbumMaster({ id: release.albumId });
		}
		if (deleteParent) {
			await this.albumService.deleteIfEmpty(release.albumId);
		}
		return release;
	}

	/**
	 * Deletes a release if it does not have related tracks
	 * @param where the query parameters to find the track to delete
	 */
	async deleteIfEmpty(where: ReleaseQueryParameters.DeleteInput): Promise<void> {
		const trackCount = await this.trackService.count({ release: where });

		if (trackCount == 0) {
			await this.delete(where);
		}
	}

	/**
	 * Sets provided release as the album's master release, unsetting other master from the same album
	 * @param where release the query parameters to find the release to set as master
	 */
	async setReleaseAsMaster(where: ReleaseQueryParameters.UpdateAlbumMaster): Promise<void> {
		const otherAlbumReleases: Release[] = (await this.getAlbumReleases(where.album))
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
			this.update(
				{ master: true },
				{ id: where.releaseId }
			)
		]);
	}

	/**
	 * Unsets provided release as the album's master release, setting another release a master of the album
	 * @param where the query parameters to find the release to et as master
	 */
	async unsetReleaseAsMaster(where: ReleaseQueryParameters.UpdateAlbumMaster): Promise<void> {
		const otherAlbumReleases: Release[] = (await this.getAlbumReleases(
			where.album, {}, {}, { sortBy: 'id', order: 'asc' }
		)).filter((albumRelease) => albumRelease.id != where.releaseId);

		if (otherAlbumReleases.find((albumRelease) => albumRelease.master)) {
			return;
		}
		if (otherAlbumReleases.length == 0) {
			return;
		}
		await Promise.allSettled([
			this.update(
				{ master: true },
				{ id: otherAlbumReleases.at(0)!.id }
			),
			this.update(
				{ master: false },
				{ id: where.releaseId }
			)
		]);
	}

	/**
	 * Reassign a release to an album
	 * @param releaseWhere the query parameters to find the release to reassign
	 * @param albumWhere the query parameters to find the album to reassign the release to
	 */
	async reassign(
		releaseWhere: ReleaseQueryParameters.WhereInput, albumWhere: AlbumQueryParameters.WhereInput
	): Promise<Release> {
		const release = await this.get(releaseWhere);
		const oldAlbum = await this.albumService.get(
			{ id: release.albumId }, { artist: true }
		);
		const newParent = await this.albumService.get(
			albumWhere, { releases: true, artist: true }
		);

		if (newParent.releases.find((newParentRelease) => newParentRelease.slug == release.slug)) {
			throw new ReleaseAlreadyExists(
				new Slug(release.slug),
				newParent.artist
					? new Slug(newParent.artist.slug)
					: undefined
			);
		}
		await this.unsetReleaseAsMaster(
			{ releaseId: release.id, album: { id: release.albumId } }
		);
		const updatedRelease = await this.update(
			{ album: albumWhere, master: newParent.releases.length == 0 },
			releaseWhere
		);

		this.illustrationService.reassignReleaseIllustrationFolder(
			new Slug(release.slug),
			new Slug(oldAlbum.slug),
			new Slug(newParent.slug),
			oldAlbum.artist ? new Slug(oldAlbum.artist.slug) : undefined,
			newParent.artist ? new Slug(newParent.artist.slug) : undefined,
		);
		await this.albumService.deleteIfEmpty(release.albumId);
		return updatedRelease;
	}

	/**
	 * Builds the path to the release's illustration
	 * @param where the query parameters to find the release
	 * @returns
	 */
	async buildIllustrationPath(
		where: ReleaseQueryParameters.WhereInput
	): Promise<IllustrationPath> {
		const release = await this.select(where, { slug: true, albumId: true });
		const album = await this.albumService.get(
			{ id: release.albumId! }, { artist: true }
		);
		const path = this.illustrationService.buildReleaseIllustrationPath(
			new Slug(album.slug),
			new Slug(release.slug!),
			album.artist ? new Slug(album.artist.slug) : undefined
		);

		return path;
	}

	/**
	 * checks if the release's illustration exists
	 * @param where the query parameters to find the release
	 * @returns true if it exists
	 */
	async illustrationExists(where: ReleaseQueryParameters.WhereInput): Promise<boolean> {
		const path = await this.buildIllustrationPath(where);

		return this.illustrationService.illustrationExists(path);
	}

	async pipeArchive(where: ReleaseQueryParameters.WhereInput, res: Response) {
		const release = await this.get(where, { tracks: true });
		const illustration = await this.buildIllustrationPath(where);
		const archive = archiver('zip');
		const outputName = `${release.slug}.zip`;

		await Promise.all(
			release.tracks.map(
				(track) => this.fileService.buildFullPath({ id: track.sourceFileId })
			)
		).then((paths) => paths.forEach((path) => {
			archive.append(createReadStream(path), { name: basename(path) });
		}));
		if (this.illustrationService.illustrationExists(illustration)) {
			archive.append(createReadStream(illustration), { name: basename(illustration) });
		}

		res.set({
			'Content-Disposition': `attachment; filename="${outputName}"`,
			'Content-Type': mime.getType(outputName) ?? 'application/octet-stream',
		});
		archive.pipe(res);
		archive.finalize();
	}

	async buildResponse(release: ReleaseWithRelations): Promise<ReleaseResponse> {
		const response = <ReleaseResponse>{
			...release,
			illustration: await this.illustrationService.getReleaseIllustrationLink(release.id)
		};

		if (release.album !== undefined) {
			response.album = await this.albumService.buildResponse(release.album);
		}
		return response;
	}
}
