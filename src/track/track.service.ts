import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import PrismaService from 'src/prisma/prisma.service';
import { Prisma, TrackType } from '@prisma/client';
import SongService from 'src/song/song.service';
import { MasterTrackNotFoundException, TrackAlreadyExistsException, TrackNotFoundByIdException } from './track.exceptions';
import ReleaseService from 'src/release/release.service';
import type TrackQueryParameters from './models/track.query-parameters';
import type ReleaseQueryParameters from 'src/release/models/release.query-parameters';
import type SongQueryParameters from 'src/song/models/song.query-params';
import FileService from 'src/file/file.service';
import Slug from 'src/slug/slug';
import { FileNotFoundFromIDException, FileNotFoundFromPathException } from 'src/file/file.exceptions';
import type { PaginationParameters } from 'src/pagination/models/pagination-parameters';
import type { MeeloException } from 'src/exceptions/meelo-exception';
import type Tracklist from './models/tracklist.model';
import { UnknownDiscIndexKey } from './models/tracklist.model';
import RepositoryService from 'src/repository/repository.service';
import { shuffle } from '@taumechanica/stout';
import type { IllustrationPath } from 'src/illustration/models/illustration-path.model';
import AlbumService from 'src/album/album.service';
import IllustrationService from 'src/illustration/illustration.service';
import LibraryService from 'src/library/library.service';
import { Release, Song, Track } from '../prisma/models';

@Injectable()
export default class TrackService extends RepositoryService<
	Track,
	TrackQueryParameters.CreateInput,
	TrackQueryParameters.WhereInput,
	TrackQueryParameters.ManyWhereInput,
	TrackQueryParameters.UpdateInput,
	TrackQueryParameters.DeleteInput,
	Prisma.TrackCreateInput,
	Prisma.TrackWhereInput,
	Prisma.TrackWhereInput,
	Prisma.TrackUpdateInput,
	Prisma.TrackWhereUniqueInput
>{
	constructor(
		@Inject(forwardRef(() => SongService))
		private songService: SongService,
		@Inject(forwardRef(() => AlbumService))
		private albumService: AlbumService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => IllustrationService))
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => FileService))
		private fileService: FileService,
		private prismaService: PrismaService,
	) {
		super(prismaService.track);
	}

	async create<I extends TrackQueryParameters.RelationInclude>(input: TrackQueryParameters.CreateInput, include?: I) {
		const created = await super.create(input, include);
		await this.songService.updateSongMaster({ byId: { id: created.songId } });
		return created;
	}

	/**
	 * Create
	 */
	formatCreateInput(input: TrackQueryParameters.CreateInput) {
		return {
			...input,
			song: {
				connect: SongService.formatWhereInput(input.song)
			},
			release: {
				connect: ReleaseService.formatWhereInput(input.release)
			},
			sourceFile: {
				connect: FileService.formatWhereInput(input.sourceFile)
			}
		}
	}
	protected async onCreationFailure(input: TrackQueryParameters.CreateInput) {
		const parentSong = await this.songService.get(input.song, { artist: true });
		const parentRelease = await this.releaseService.get(input.release);
		await this.fileService.throwIfNotFound(input.sourceFile);
		return new TrackAlreadyExistsException(
			input.name,
			new Slug(parentRelease.slug),
			new Slug(parentSong.artist.slug)
		);	
	}
	protected formatCreateInputToWhereInput(input: TrackQueryParameters.CreateInput): TrackQueryParameters.WhereInput {
		return input;
	}

	/**
	 * Get
	 */
	static formatWhereInput(where: TrackQueryParameters.WhereInput) {
		return {
			id: where.id,
			master: where.masterOfSong ? true : undefined,
			song: where.masterOfSong ?
				SongService.formatWhereInput(where.masterOfSong)
			: undefined,
			sourceFile: where.sourceFile ?
				FileService.formatWhereInput(where.sourceFile)
			: undefined
		}
	}
	formatWhereInput = TrackService.formatWhereInput;

	static formatManyWhereInput(where: TrackQueryParameters.ManyWhereInput): Prisma.TrackWhereInput {
		let queryParameters: Prisma.TrackWhereInput = {
			type: where.type,
			song: where.bySong ? SongService.formatWhereInput(where.bySong) : undefined,
			sourceFile: where.byLibrarySource ? {
				library: LibraryService.formatWhereInput(where.byLibrarySource)
			} : undefined,
		};
		if (where.byRelease) {
			queryParameters = {
				...queryParameters,
				release: ReleaseService.formatWhereInput(where.byRelease)
			}
		}
		if (where.byAlbum) {
			queryParameters = {
				...queryParameters,
				release: {
					album: AlbumService.formatWhereInput(where.byAlbum!)	
				}
			}
		}
		if (where.byArtist) {
			queryParameters = {
				...queryParameters,
				release: {
					album: AlbumService.formatManyWhereInput({ byArtist: where.byArtist })
				}
			}
		}
		return queryParameters; 
	}
	formatManyWhereInput = TrackService.formatManyWhereInput;

	/**
	 * Callback on track not found
	 * @param where the query parameters that failed to get the release
	 */
	async onNotFound(where: TrackQueryParameters.WhereInput): Promise<MeeloException> {
		if (where.id !== undefined)
			throw new TrackNotFoundByIdException(where.id);
		if (where.masterOfSong) {
			const parentSong = await this.songService.get(where.masterOfSong, { artist: true });
			throw new MasterTrackNotFoundException(
				new Slug(parentSong.slug),
				new Slug(parentSong.artist!.slug)
			);
		} 
		if (where.sourceFile.id !== undefined)
			throw new FileNotFoundFromIDException(where.sourceFile.id);
		throw new FileNotFoundFromPathException(where.sourceFile.byPath!.path);
	}


	/**
	 * Fetch the tracks from a song
	 * Returns an empty array if the song does not exist
	 * @param where the parameters to find the parent song
	 * @param pagination the pagniation parameters
	 * @param include the relation to include in the returned objects
	 * @returns the list of tracks related to the song
	 */
	async getSongTracks<I extends TrackQueryParameters.RelationInclude>(
		where: SongQueryParameters.WhereInput,
		pagination?: PaginationParameters,
		include?: I,
		sort?: TrackQueryParameters.SortingParameter
	) {
		const tracks = await this.getMany(
			{ bySong: where },
			pagination,
			include,
			sort
		);
		if (tracks.length == 0)
			await this.songService.throwIfNotFound(where);
		return tracks;
	}


	/**
	 * Fetch the master tracks of a song
	 * @param where the parameters to find the parent song
	 * @param include the relation to include in the returned object
	 * @returns the master track of the song
	 */
	async getMasterTrack(
		where: SongQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude
	) {
		return this.get(
			{ masterOfSong: where },
			include
		);
	}

	/**
	 * Get Tracklist of release
	 * @param where 
	 * @returns the tracklist of the release
	 */
	async getTracklist(
		where: ReleaseQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
	): Promise<Tracklist> {
		let tracklist: Tracklist = new Map();
		const tracks = await this.getMany({ byRelease: where }, {}, include, { sortBy: 'trackIndex', order: 'asc' });
		if (tracks.length == 0)
			await this.releaseService.throwIfNotFound(where);
		tracks.forEach((track) => {
			const indexToString = track.discIndex?.toString() ?? UnknownDiscIndexKey;
			tracklist = tracklist.set(indexToString, [ ...tracklist.get(indexToString) ?? [], track]);
		});
		return new Map([...tracklist].sort());
	}

	/**
	 * Get Playlist of release
	 * @param where query paremeters to find the release
	 * @returns all the tracks, ordered, from a release
	 */
	async getPlaylist(
		where: ReleaseQueryParameters.WhereInput,
		include?: TrackQueryParameters.RelationInclude,
		random: boolean = false
	): Promise<Track[]> {
		const tracklist = await this.getTracklist(where, include);
		let playlist: Track[] = [];
		tracklist.forEach((disc) => playlist = playlist.concat(disc));
		if (random)
			shuffle(playlist);
		return playlist;
	}

	/**
	 * Update
	 */
	formatUpdateInput(what: Partial<TrackQueryParameters.CreateInput>): Prisma.TrackUpdateInput {
		return {
			...what,
			song: what.song ? {
				connect: SongService.formatWhereInput(what.song)
			} : undefined,
			release: what.release ? {
				connect: ReleaseService.formatWhereInput(what.release)
			} : undefined,
			sourceFile: what.sourceFile ? {
				connect: FileService.formatWhereInput(what.sourceFile)
			} : undefined
		}
	}

	/**
	 * Updates the track in the database
	 * @param what the fields to update in the track
	 * @param where the query parameters to find the track to update
	 */
	
	async update(
		what: TrackQueryParameters.UpdateInput,
		where: TrackQueryParameters.WhereInput
	) {
		try {
			const unmodifiedTrack = await this.get(where);
			let updatedTrack = await super.update(what, where);
			const masterChangeInput: TrackQueryParameters.UpdateSongMaster = {
				trackId: updatedTrack.id,
				song: { byId: { id: updatedTrack.songId } }
			};
			if (!unmodifiedTrack.master && what.master) {
				await this.setTrackAsMaster(masterChangeInput);
			} else if (unmodifiedTrack.master && what.master === false) {
				await this.unsetTrackAsMaster(masterChangeInput);
			}
			return updatedTrack;
		} catch {
			throw await this.onNotFound(where);
		}
	}

	/**
	 * Delete
	 */
	formatDeleteInput(where: TrackQueryParameters.DeleteInput) {
		return where;
	}
	async onDeletionFailure(where: TrackQueryParameters.DeleteInput) {
		if (where.id !== undefined)
			return new TrackNotFoundByIdException(where.id);
		return new FileNotFoundFromIDException(where.sourceFileId);
	}
	protected formatDeleteInputToWhereInput(input: TrackQueryParameters.DeleteInput) {
		if (input.id)
			return { id: input.id };
		return { sourceFile: { id: input.sourceFileId! } }
	}

	/**
	 * Deletes a track
	 * @param where Query parameters to find the track to delete 
	 */
	async delete(where: TrackQueryParameters.DeleteInput, deleteParent: boolean = true): Promise<Track> {
		try {
			let deletedTrack = await super.delete(where);
			Logger.warn(`Track '${deletedTrack.name}' deleted`);
			if (deletedTrack.master)
				await this.songService.updateSongMaster({ byId: { id: deletedTrack.songId } });
			if (deleteParent) {
				await this.songService.deleteIfEmpty({ id: deletedTrack.songId });
				await this.releaseService.deleteIfEmpty({ byId: { id: deletedTrack.releaseId } });
			}
			return deletedTrack;
		} catch {
			throw this.onDeletionFailure(where);
		}
	}

	/**
	 * Sets provided track as the song's master track, unsetting other master from the same song
	 * @param where the query parameters to find the track to set as master
	 */
	async setTrackAsMaster(where: TrackQueryParameters.UpdateSongMaster): Promise<void> {
		let otherTracks: Track[] = (await this.getSongTracks(where.song))
			.filter((track) => track.id != where.trackId);
		
		await Promise.allSettled([
			this.prismaService.track.updateMany({
				data: { master: false },
				where: {
					id: {
						in: otherTracks.map((track) => track.id)
					}
				}
			}),
			this.update(
				{ master: true },
				{ id: where.trackId }
			)
		]);
	}

	/**
	 * Unsets provided track as the song's master track, setting another track as master of the song
	 * @param where the query parameters to find the track to unset as master
	 */
	async unsetTrackAsMaster(where: TrackQueryParameters.UpdateSongMaster): Promise<void> {
		let otherTracks: Track[] = (await this.getSongTracks(where.song, {}, {}, { sortBy: 'id', order: 'asc' }))
			.filter((track) => track.id != where.trackId);
		if (otherTracks.find((track) => track.master))
			return;
		if (otherTracks.length == 0)
			return;
		let newMaster = otherTracks[0];
		const audioTracks = otherTracks.filter((track) => track.type == TrackType.Audio);
		if (audioTracks.length != 0)
			newMaster = audioTracks[0];
		await Promise.allSettled([
			this.update(
				{ master: true },
				{ id: newMaster.id }
			),
			this.update(
				{ master: false },
				{ id: where.trackId }
			)
		]);
	}
	
	/**
	 * Change the track's parent song
	 * If the previous parent is empty, it will be deleted
	 * @param trackWhere the query parameters to find the track to reassign
	 * @param newParentWhere the query parameters to find the song to reassign the track to
	 */
	async reassign(
		trackWhere: TrackQueryParameters.WhereInput, newParentWhere: SongQueryParameters.WhereInput
	): Promise<Track> {
		const track = await this.get(trackWhere);
		const newParent = await this.songService.get(newParentWhere, { tracks: true });
		await this.unsetTrackAsMaster({
			trackId: track.id,
			song: { byId: { id: track.songId } }
		});
		const updatedTrack = await this.update({
			song: { byId: { id: newParent.id } },
			master: newParent.tracks.length == 0
		}, trackWhere);
		await this.songService.deleteIfEmpty({ id: track.songId });
		return updatedTrack;
	}

	/**
	 * builds the path of the illustration of the track.
	 * @param where the query parameters to find the track
	 */
	async buildIllustrationPath(where: TrackQueryParameters.WhereInput): Promise<IllustrationPath> {
		let track = await this.get(where, { release: true });
		let album = await this.albumService.get({ byId: { id: track.release.albumId } }, { artist: true })
		return this.illustrationService.buildTrackIllustrationPath(
			new Slug(album.slug),
			new Slug(track.release.slug),
			album.artist ? new Slug(album.artist.slug) : undefined,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);
	}

	async buildResponse<ResponseType extends Track & { illustration: string, stream: string }>(
		track: Track & Partial<{ release: Release, song: Song }>
	): Promise<ResponseType> {
		let response = <ResponseType>{
			...track,
			illustration: await this.illustrationService.getTrackIllustrationLink(track.id),
			stream: `/files/${track.sourceFileId}/stream`
		};
		if (track.release !== undefined)
			response = {
				...response,
				release: await this.releaseService.buildResponse(track.release)
			}
		if (track.song != undefined)
			response = {
				...response,
				song: await this.songService.buildResponse(track.song)
			}
		return response;
	}

	async buildTracklistResponse(tracklist: Tracklist) {
		let response = {};
		for (let [disc, tracks] of tracklist) {
			response = {
				...response,
				[disc]: await Promise.all(tracks.map((track) => this.buildResponse(track)))
			}
		}
		return response;
	} 
}
