import { Injectable } from "@nestjs/common";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { ArtistIllustration } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import IllustrationService from "./illustration.service";
import SettingsService from "src/settings/settings.service";
import { basename, join } from 'path';
import compilationAlbumArtistKeyword from "src/utils/compilation";
import Jimp from "jimp/*";
import { IllustrationNotExtracted } from "./illustration.exceptions";
import Logger from "src/logger/logger";
import IllustrationResponse from "./models/illustration.response";

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
			where: ArtistService.formatWhereInput(where)
		}).then((value) => value && ({
			...value,
			url: '/illustrations/artists/' + where.slug ?? where.id
		}));
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
			where: ArtistService.formatWhereInput(where),
			update: { blurhash, colors }
		});
	}

	/**
	 * Deletes Artist Illustration (File + info in DB)
	 */
	async deleteArtistIllustration(
		where: ArtistQueryParameters.WhereInput
	): Promise<void> {
		const artist = await this.artistService.get(where);
		const illustrationPath = this.getArtistIllustrationPath(artist.slug);

		this.illustrationService.deleteIllustration(illustrationPath);
		this.prismaService.artistIllustration.delete({
			where: ArtistService.formatWhereInput(where)
		}).catch(() => {});
	}

	/**
	 * Extract the illustration embedded into/in the same folder as the source file
	 * Then creates illustration item in DB (according to the type (release, disc, or track))
	 */
	async registerTrackFileIllustration(
		trackId: number, sourceFilePath: string,
	): Promise<void> {
		const track = await this.prismaService.track.findFirstOrThrow({
			where: { id: trackId },
			include: {
				release: { include: { album: { include: { artist: true } } } }
			}
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
				//TODO Get from DB
				return path;
			}
			if (illustrationExtractionStatus === 'extracted') {
				this.logger.verbose(`Extracting illustration from '${fileName}' successful`);
				//TODO Save in DB
				return path;
			}
		}
	}
}
