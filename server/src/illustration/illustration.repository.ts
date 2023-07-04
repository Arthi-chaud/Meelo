import { Injectable } from "@nestjs/common";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { ArtistIllustration, Track } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import IllustrationService from "./illustration.service";
import SettingsService from "src/settings/settings.service";
import {
	basename, dirname, join
} from 'path';
import compilationAlbumArtistKeyword from "src/utils/compilation";
import Jimp from "jimp/*";
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
		private artistService: ArtistService,
		private releaseService: ReleaseService,
		private trackService: TrackService,
		private settingsService: SettingsService
	) {
		this.baseIllustrationFolderPath = join(
			this.settingsService.settingsValues.meeloFolder!,
			'metadata'
		);
	}

	/**
	 * Get Absolute path to an artist's illustration
	 */
	getArtistIllustrationPath(artistSlug: string) {
		return join(this.baseIllustrationFolderPath, artistSlug, this.illustrationFileName);
	}

	getReleaseIllustrationPath(
		artistSlug: string | undefined, albumSlug: string, releaseSlug: string
	): string {
		return join(
			artistSlug
				? this.getArtistIllustrationPath(artistSlug)
				: compilationAlbumArtistKeyword,
			albumSlug,
			releaseSlug,
			this.illustrationFileName
		);
	}

	getDiscIllustrationPath(
		artistSlug: string | undefined, albumSlug: string, releaseSlug: string, discIndex?: number
	): string {
		return join(
			this.getReleaseIllustrationPath(artistSlug, albumSlug, releaseSlug),
			`disc-${discIndex ?? 0}`,
			this.illustrationFileName
		);
	}

	getTrackIllustrationPath(
		artistSlug: string | undefined, albumSlug: string, releaseSlug: string,
		discIndex?: number, trackIndex?: number
	): string {
		return join(
			this.getDiscIllustrationPath(artistSlug, albumSlug, releaseSlug, discIndex ?? 0),
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
	): Promise<IllustrationResponse | null> {
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

	async getReleaseIllustration(
		where: ReleaseQueryParameters.WhereInput,
		discIndex: number | null
	): Promise<IllustrationResponse | null> {
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

	async getSongIllustration(
		where: SongQueryParameters.WhereInput
	): Promise<IllustrationResponse | null> {
		return this.trackService.getMasterTrack(where)
			.then((track) => this.getTrackIllustration({ id: track.id }));
	}

	async getAlbumIllustration(
		where: AlbumQueryParameters.WhereInput
	): Promise<IllustrationResponse | null> {
		return this.releaseService.getMasterRelease(where)
			.then((release) => this.getReleaseIllustration({ id: release.id }, null));
	}

	/**
	 * If the track does not have a specific illustration, fallback on parent disc, then release
	 */
	async getTrackIllustration(
		where: TrackQueryParameters.WhereInput
	): Promise<IllustrationResponse | null> {
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
		const discIllustration = await this.getReleaseIllustration(
			{ id: track.releaseId }, track.discIndex
		);

		if (discIllustration) {
			return discIllustration;
		}
		return this.getReleaseIllustration({ id: track.releaseId }, null);
	}

	async createArtistIllustration(
		buffer: Buffer,
		where: ArtistQueryParameters.WhereInput
	): Promise<ArtistIllustration> {
		const artist = await this.artistService.get(where);
		const artistIllustrationPath = this.getArtistIllustrationPath(artist.slug);
		const [blurhash, colors] = await Promise.all([
			this.illustrationService.getIllustrationBlurHash(buffer),
			this.illustrationService.getIllustrationColors(buffer)
		]);

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
	 * Deletes all Release Illustrations (Files + info in DB) (including disc-specific illustrations)
	 */
	async deleteReleaseIllustration(
		where: ReleaseQueryParameters.WhereInput
	): Promise<void> {
		const release = await this.prismaService.release.findFirstOrThrow({
			where: ReleaseService.formatWhereInput(where),
			include: { album: { include: { artist: true } } }
		});
		const releaseIllustrationPath = this.getReleaseIllustrationPath(
			release.album.artist?.slug,
			release.album.slug,
			release.slug
		);
		const releaseIllustrationFolder = dirname(releaseIllustrationPath);

		this.illustrationService.deleteIllustrationFolder(releaseIllustrationFolder);
		this.prismaService.releaseIllustration.deleteMany({
			where: ReleaseService.formatWhereInput(where)
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
	 */
	async registerTrackFileIllustration(
		where: TrackQueryParameters.WhereInput, sourceFilePath: string,
	): Promise<void> {
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
			return;
		}
		const illustrationBytes = await (await Jimp.read(illustration))
			.getBufferAsync(Jimp.MIME_JPEG);
		const [blurhash, colors] = await Promise.all([
			this.illustrationService.getIllustrationBlurHash(illustrationBytes),
			this.illustrationService.getIllustrationColors(illustrationBytes)
		]);

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
			}
			if (illustrationExtractionStatus === 'extracted') {
				this.logger.verbose(`Extracting illustration from '${fileName}' successful`);
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
			}
		}
	}
}
