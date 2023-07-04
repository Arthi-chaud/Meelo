import { Injectable } from "@nestjs/common";
import ArtistService from "src/artist/artist.service";
import ArtistQueryParameters from "src/artist/models/artist.query-parameters";
import { ArtistIllustration } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import IllustrationService from "./illustration.service";
import SettingsService from "src/settings/settings.service";
import { join } from 'path';

@Injectable()
export default class IllustrationRepository {
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
		return join(this.baseIllustrationFolderPath, artistSlug);
	}

	/**
	 * Get the artist's Illustration row
	 * @param where the query input of the artist
	 * @returns null if the illustration does not exist
	 */
	getArtistIllustration(
		where: ArtistQueryParameters.WhereInput
	): Promise<ArtistIllustration | null> {
		return this.prismaService.artistIllustration.findFirst({
			where: ArtistService.formatWhereInput(where)
		});
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

	async register
}
