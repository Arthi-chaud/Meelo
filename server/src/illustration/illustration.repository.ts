import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import {
	ArtistIllustration, PlaylistIllustration, ReleaseIllustration, Track, TrackIllustration
} from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import IllustrationService from "./illustration.service";
import SettingsService from "src/settings/settings.service";
import {
	basename, dirname, join
} from 'path';
import compilationAlbumArtistKeyword from "src/utils/compilation";
import { IllustrationNotExtracted } from "./illustration.exceptions";
import Logger from "src/logger/logger";
import IllustrationResponse from "./models/illustration.response";
import TrackQueryParameters from "src/track/models/track.query-parameters";
import TrackService from "src/track/track.service";
import { IllustrationPath } from "./models/illustration-path.model";
import ReleaseQueryParameters from "src/release/models/release.query-parameters";
import ReleaseService from "src/release/release.service";
import SongQueryParameters from "src/song/models/song.query-params";
import AlbumQueryParameters from "src/album/models/album.query-parameters";
import ProviderService from "src/providers/provider.service";
import FfmpegService from "src/ffmpeg/ffmpeg.service";
import PlaylistQueryParameters from "src/playlist/models/playlist.query-parameters";
import PlaylistService from "src/playlist/playlist.service";
import FileManagerService from "src/file-manager/file-manager.service";

/**
 * This service handles the paths to illustrations files and the related tables in the DB
 */
@Injectable()
export default class IllustrationRepository {
	private readonly logger = new Logger(IllustrationRepository.name);
	private readonly illustrationFileName = 'cover.jpg';
	private readonly baseIllustrationFolderPath: string;
	constructor(
		private prismaService: PrismaService,
		private illustrationService: IllustrationService,
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
		@Inject(forwardRef(() => ReleaseService))
		private releaseService: ReleaseService,
		@Inject(forwardRef(() => TrackService))
		private trackService: TrackService,
		@Inject(forwardRef(() => PlaylistService))
		private playlistService: PlaylistService,
		private settingsService: SettingsService,
		@Inject(forwardRef(() => ProviderService))
		private providerService: ProviderService,
		private ffmpegService: FfmpegService,
		private fileManagerService: FileManagerService
	) {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			'metadata'
		);
	}

	/**
	 * Get Absolute path to an artist's illustration
	 */
	getPlaylistIllustrationPath(playlistSlug: string) {
		return join(this.baseIllustrationFolderPath, '_playlists', playlistSlug, this.illustrationFileName);
	}

	/**
	 * Get Absolute path to a playlist's illustration
	 */
	getArtistIllustrationPath(artistSlug: string | undefined) {
		return join(
			this.baseIllustrationFolderPath,
			artistSlug ?? compilationAlbumArtistKeyword,
			this.illustrationFileName
		);
	}

	getAlbumIllustrationFolderPath(
		artistSlug: string | undefined, albumSlug: string
	): string {
		return join(
			dirname(this.getArtistIllustrationPath(artistSlug)),
			albumSlug
		);
	}

	getReleaseIllustrationPath(
		artistSlug: string | undefined, albumSlug: string, releaseSlug: string
	): string {
		return join(
			this.getAlbumIllustrationFolderPath(artistSlug, albumSlug),
			releaseSlug,
			this.illustrationFileName
		);
	}

	getDiscIllustrationPath(
		artistSlug: string | undefined, albumSlug: string, releaseSlug: string, discIndex?: number
	): string {
		return join(
			dirname(this.getReleaseIllustrationPath(artistSlug, albumSlug, releaseSlug)),
			`disc-${discIndex ?? 0}`,
			this.illustrationFileName
		);
	}

	getTrackIllustrationPath(
		artistSlug: string | undefined, albumSlug: string, releaseSlug: string,
		discIndex?: number, trackIndex?: number
	): string {
		return join(
			dirname(
				this.getDiscIllustrationPath(artistSlug, albumSlug, releaseSlug, discIndex ?? 0)
			),
			`track-${trackIndex ?? 0}`,
			this.illustrationFileName
		);
	}

	/**
	 * Returns the paths of illustration of the parent release, the parent disc and the track itself
	 */
	async getTrackIllustrationPaths(
		where: TrackQueryParameters.WhereInput
	): Promise<[Track, IllustrationPath, IllustrationPath, IllustrationPath]> {
		const track = await this.prismaService.track.findFirstOrThrow({
			where: TrackService.formatWhereInput(where),
			include: {
				release: { include: { album: { include: { artist: true } } } }
			}
		}).catch((err) => {
			throw this.trackService.onNotFound(err, where);
		});
		const releaseSlug = track.release.slug;
		const artistSlug = track.release.album.artist
			? track.release.album.artist.slug
			: undefined;
		const albumSlug = track.release.album.slug;
		const releaseIllustrationPath = this.getReleaseIllustrationPath(
			artistSlug,
			albumSlug,
			releaseSlug
		);
		const discIllustrationPath = this.getDiscIllustrationPath(
			artistSlug,
			albumSlug,
			releaseSlug,
			track.discIndex ?? undefined
		);
		const trackIllustrationPath = this.getTrackIllustrationPath(
			artistSlug,
			albumSlug,
			releaseSlug,
			track.discIndex ?? undefined,
			track.trackIndex ?? undefined
		);

		return [track, releaseIllustrationPath, discIllustrationPath, trackIllustrationPath];
	}

	/**
	 * Get the artist's Illustration row
	 * @param where the query input of the artist
	 * @returns null if the illustration does not exist
	 */
	async getArtistIllustration(
		where: ArtistQueryParameters.WhereInput
	): Promise<(ArtistIllustration & IllustrationResponse) | null> {
		if (where.compilationArtist == true) {
			return null;
		}
		return this.prismaService.artistIllustration.findFirst({
			where: { artist: ArtistService.formatWhereInput(where) }
		}).then((value) => value && ({
			...value,
			url: '/illustrations/artists/' + where.slug ?? where.id
		}));
	}

	async getPlaylistIllustration(
		where: PlaylistQueryParameters.WhereInput
	): Promise<(PlaylistIllustration & IllustrationResponse) | null> {
		return this.prismaService.playlistIllustration.findFirst({
			where: { playlist: this.playlistService.formatWhereInput(where) }
		}).then((value) => value && ({
			...value,
			url: '/illustrations/playlists/' + where.slug ?? where.id
		}));
	}

	async getReleaseIllustration(
		where: ReleaseQueryParameters.WhereInput,
		discIndex?: number
	): Promise<(ReleaseIllustration & IllustrationResponse) | null> {
		return this.prismaService.releaseIllustration.findMany({
			where: { release: ReleaseService.formatWhereInput(where), disc: discIndex },
			orderBy: { disc: { nulls: 'first', sort: 'asc' } },
		})
			.then((res) => res.at(0) ?? null)
			.then((value) => value && ({
				...value,
				url: '/illustrations/releases/' + value.releaseId
			}));
	}

	async resolveReleaseIllustrationPath(
		illustration: ReleaseIllustration
	): Promise<IllustrationPath> {
		const release = await this.prismaService.release
			.findFirstOrThrow({
				where: ReleaseService.formatWhereInput({ id: illustration.releaseId }),
				include: { tracks: true, album: { include: { artist: true } } }
			})
			.catch(async (err) => {
				throw await this.releaseService.onNotFound(err, { id: illustration.releaseId });
			});

		if (illustration.disc === null) {
			return this.getReleaseIllustrationPath(
				release.album.artist?.slug,
				release.album.slug,
				release.slug
			);
		}
		return this.getDiscIllustrationPath(
			release.album.artist?.slug,
			release.album.slug,
			release.slug,
			illustration.disc
		);
	}

	async getSongIllustration(
		where: SongQueryParameters.WhereInput
	) {
		return this.trackService.getMasterTrack(where)
			.then((track) => this.getTrackIllustration({ id: track.id }))
			.catch(() => null);
	}

	async getAlbumIllustration(
		where: AlbumQueryParameters.WhereInput
	): Promise<(ReleaseIllustration & IllustrationResponse) | null> {
		return this.releaseService.getMasterRelease(where)
			.then((release) => this.getReleaseIllustration({ id: release.id }));
	}

	/**
	 * If the track does not have a specific illustration, fallback on parent disc, then release
	 */
	async getTrackIllustration(
		where: TrackQueryParameters.WhereInput
	) {
		const track = await this.trackService.get(where);
		const trackIllustration = await this.prismaService.trackIllustration.findFirst({
			where: { trackId: track.id },
		}).then((value) => value && ({
			...value,
			url: '/illustrations/tracks/' + value.trackId
		}));

		if (trackIllustration) {
			return trackIllustration;
		}
		if (track.discIndex !== null) {
			const discIllustration = await this.getReleaseIllustration(
				{ id: track.releaseId }, track.discIndex
			);

			if (discIllustration) {
				return discIllustration;
			}
		}
		return this.getReleaseIllustration({ id: track.releaseId });
	}

	async createArtistIllustration(
		buffer: Buffer,
		where: ArtistQueryParameters.WhereInput
	): Promise<ArtistIllustration> {
		const artist = await this.artistService.get(where);
		const artistIllustrationPath = this.getArtistIllustrationPath(artist.slug);
		const [blurhash, colors] = await this.illustrationService
			.getIllustrationBlurHashAndColors(buffer);

		this.illustrationService.saveIllustration(buffer, artistIllustrationPath);
		return this.prismaService.artistIllustration.upsert({
			create: {
				blurhash, colors,
				artistId: artist.id
			},
			where: { artistId: artist.id },
			update: { blurhash, colors }
		});
	}

	async createPlaylistIllustration(
		buffer: Buffer,
		where: PlaylistQueryParameters.WhereInput
	): Promise<PlaylistIllustration> {
		const playlist = await this.playlistService.get(where);
		const playlistIllustrationPath = this.getPlaylistIllustrationPath(playlist.slug);
		const [blurhash, colors] = await this.illustrationService
			.getIllustrationBlurHashAndColors(buffer);

		this.illustrationService.saveIllustration(buffer, playlistIllustrationPath);
		return this.prismaService.playlistIllustration.upsert({
			create: {
				blurhash, colors,
				playlistId: playlist.id
			},
			where: { playlistId: playlist.id },
			update: { blurhash, colors }
		});
	}

	async createReleaseIllustration(
		buffer: Buffer,
		where: ReleaseQueryParameters.WhereInput
	): Promise<ReleaseIllustration> {
		const release = await this.releaseService.get(where);
		const releaseIllustrationPath = this.getPlaylistIllustrationPath(release.slug);
		const [blurhash, colors] = await this.illustrationService
			.getIllustrationBlurHashAndColors(buffer);
		const previousMainIllustration = await this.getReleaseIllustration(where);

		this.illustrationService.saveIllustration(buffer, releaseIllustrationPath);
		return this.prismaService.releaseIllustration.upsert({
			create: {
				blurhash, colors,
				releaseId: release.id
			},
			where: { id: previousMainIllustration?.id },
			update: { blurhash, colors }
		});
	}

	async createTrackIllustration(
		buffer: Buffer,
		where: TrackQueryParameters.WhereInput
	): Promise<TrackIllustration> {
		const [track, __, ___, trackIllustrationPath] = await this.getTrackIllustrationPaths(where);
		const [blurhash, colors] = await this.illustrationService
			.getIllustrationBlurHashAndColors(buffer);

		this.illustrationService.saveIllustration(buffer, trackIllustrationPath);
		return this.prismaService.trackIllustration.upsert({
			create: {
				blurhash, colors,
				trackId: track.id
			},
			where: { trackId: track.id },
			update: { blurhash, colors }
		});
	}

	/**
	 * Deletes Artist Illustration (File + info in DB)
	 */
	async deleteArtistIllustration(
		where: ArtistQueryParameters.WhereInput,
		opt: { withFolder: boolean }
	): Promise<void> {
		const artist = await this.artistService.get(where);
		const illustrationPath = this.getArtistIllustrationPath(artist.slug);

		if (opt.withFolder) {
			this.illustrationService.deleteIllustrationFolder(dirname(illustrationPath));
		} else {
			this.illustrationService.deleteIllustration(illustrationPath);
		}
		this.prismaService.artistIllustration.delete({
			where: { artistId: artist.id }
		}).catch(() => {});
	}

	/**
	 * Deletes Playlist Illustration (File + info in DB)
	 */
	async deletePlaylistIllustration(
		where: PlaylistQueryParameters.WhereInput
	): Promise<void> {
		const playlist = await this.playlistService.get(where);
		const illustrationPath = this.getPlaylistIllustrationPath(playlist.slug);

		this.illustrationService.deleteIllustrationFolder(dirname(illustrationPath));
		this.prismaService.playlistIllustration.delete({
			where: { playlistId: playlist.id }
		}).catch(() => {});
	}

	/**
	 * Deletes Album Illustrations (File + info in DB)
	 */
	async deleteAlbumIllustrations(
		where: AlbumQueryParameters.WhereInput
	): Promise<void> {
		const releases = await this.releaseService.getMany({ album: where });

		await Promise.all(
			releases.map((release) => this.deleteReleaseIllustration(
				{ id: release.id }, { withFolder: true }
			))
		);
	}

	/**
	 * Deletes Release Illustration (File + info in DB)
	 */
	async deleteReleaseIllustration(
		where: ReleaseQueryParameters.WhereInput,
		opt: { withFolder: boolean },
		discNumber?: number | null
	): Promise<void> {
		const release = await this.prismaService.release.findFirstOrThrow({
			where: ReleaseService.formatWhereInput(where),
			include: { album: { include: { artist: true } }, tracks: { take: 1 } }
		}).catch(async (err) => {
			throw await this.releaseService.onNotFound(err, where);
		});
		const illustrationPath = discNumber
			// If disc is specified, we target its directory
			? this.getDiscIllustrationPath(
				release.album.artist?.slug,
				release.album.slug,
				release.slug,
				discNumber
			// Else, we get the release's folder
			) : this.getReleaseIllustrationPath(
				release.album.artist?.slug,
				release.album.slug,
				release.slug
			);

		if (opt.withFolder) {
			this.illustrationService.deleteIllustrationFolder(dirname(illustrationPath));
		} else {
			this.illustrationService.deleteIllustration(illustrationPath);
		}
		this.prismaService.releaseIllustration.deleteMany({
			where: { release: ReleaseService.formatWhereInput(where), disc: discNumber }
		}).catch(() => {});
	}

	/**
	 * Deletes Track Illustration (File + info in DB)
	 */
	async deleteTrackIllustration(
		where: TrackQueryParameters.WhereInput
	): Promise<void> {
		const [track, __, ___, trackIllustration] = (await this.getTrackIllustrationPaths(where));
		const trackIllustrationFolder = dirname(trackIllustration);

		this.illustrationService.deleteIllustrationFolder(trackIllustrationFolder);
		this.prismaService.trackIllustration.delete({
			where: { trackId: track.id }
		}).catch(() => {});
	}

	/**
	 * Extract the illustration embedded into/in the same folder as the source file
	 * Then creates illustration item in DB (according to the type (release, disc, or track))
	 * @returns the path of the saved file
	 */
	async registerTrackFileIllustration(
		where: TrackQueryParameters.WhereInput, sourceFilePath: string,
	): Promise<string | null> {
		const [
			track,
			releaseIllustrationPath,
			discIllustrationPath,
			trackIllustrationPath
		] = await this.getTrackIllustrationPaths(where);
		const [embeddedIllustration, inlineIllustration] = await Promise.all([
			this.illustrationService.extractIllustrationFromFile(sourceFilePath),
			this.illustrationService.extractIllustrationInFileFolder(sourceFilePath),
		]);
		const illustration = (this.settingsService.settingsValues.metadata
			.source == 'embedded' ? embeddedIllustration : inlineIllustration)
			?? (this.settingsService.settingsValues.metadata.order == 'preferred'
				? embeddedIllustration ?? inlineIllustration
				: null);

		if (illustration == null) {
			return null;
		}
		const illustrationBytes = illustration;

		for (const path of [releaseIllustrationPath, discIllustrationPath, trackIllustrationPath]) {
			const illustrationExtractionStatus = await this.illustrationService
				.saveIllustrationWithStatus(illustrationBytes, path);
			const fileName = basename(track.name);

			if (illustrationExtractionStatus === 'different-illustration') {
				continue;
			}
			if (illustrationExtractionStatus === 'error') {
				throw new IllustrationNotExtracted(`Extracting illustration from '${fileName}' failed`);
			}
			if (illustrationExtractionStatus === 'already-extracted') {
				this.logger.verbose(`Extracting illustration from '${fileName}' already done`);
				return path;
			}
			if (illustrationExtractionStatus === 'extracted') {
				this.logger.verbose(`Extracting illustration from '${fileName}' successful`);
				const [blurhash, colors] = await this.illustrationService
					.getIllustrationBlurHashAndColors(illustrationBytes);

				if (path == releaseIllustrationPath || path == discIllustrationPath) {
					await this.prismaService.releaseIllustration.create({
						data: {
							colors, blurhash,
							releaseId: track.releaseId,
							disc: path == discIllustrationPath ? track.discIndex : null
						}
					});
				} else if (path == trackIllustrationPath) {
					await this.prismaService.trackIllustration.create({
						data: { colors, blurhash, trackId: track.id }
					});
				}
				return path;
			}
		}
		return null;
	}

	async registerVideoTrackScreenshot(
		where: TrackQueryParameters.WhereInput, sourceFilePath: string,
	): Promise<TrackIllustration | null> {
		const [track, __, ___, outPath] = await this.getTrackIllustrationPaths(where);

		if (track.type != 'Video') {
			return null;
		}
		await this.ffmpegService.takeVideoScreenshot(sourceFilePath, outPath);
		return this.createTrackIllustration(
			await this.fileManagerService.getFileBuffer(outPath),
			where
		);
	}

	/**
	 * Move an album's illustrations folder to another artist
	 */
	reassignAlbumIllustration(
		albumSlug: string, previousArtistSlug: string | undefined, newArtistSlug: string | undefined
	) {
		const oldPath = this.getAlbumIllustrationFolderPath(
			previousArtistSlug, albumSlug
		);
		const newPath = this.getAlbumIllustrationFolderPath(
			newArtistSlug, albumSlug
		);

		this.illustrationService.moveIllustrationFolder(oldPath, newPath);
	}

	/**
	 * Move a release's illustrations folder
	 */
	reassignReleaseIllustration(
		releaseSlug: string, oldAlbumSlug: string, newAlbumSlug: string,
		oldArtistSlug?: string, newArtistSlug?: string
	) {
		const oldPath = dirname(this.getReleaseIllustrationPath(
			oldArtistSlug, oldAlbumSlug, releaseSlug
		));
		const newPath = dirname(this.getReleaseIllustrationPath(
			newArtistSlug, newAlbumSlug, releaseSlug
		));

		this.illustrationService.moveIllustrationFolder(oldPath, newPath);
	}

	async downloadMissingArtistIllustrations() {
		const artistsWithoutIllustrations = await this.prismaService.artist.findMany({
			where: { illustration: null },
			include: { externalIds: true }
		});

		await Promise.allSettled(artistsWithoutIllustrations.map((artist) => {
			return this.providerService.runAction(async (provider) => {
				// We select the external id of the artist from the current provider
				const externalIdProvider = artist.externalIds
					.find((id) => this.providerService
						.getProviderById(id.providerId).name == provider.name);

				if (!externalIdProvider) {
					return;
				}
				const illustrationUrl = await provider
					.getArtistIllustrationUrl(externalIdProvider.value);

				return this.illustrationService
					.downloadIllustration(illustrationUrl)
					.then((buffer) => this.createArtistIllustration(buffer, { id: artist.id }))
					.then(() => this.logger.verbose(`Illustration found for artist '${artist.name}'`));
			});
		}));
	}
}
