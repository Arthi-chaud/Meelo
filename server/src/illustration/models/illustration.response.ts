import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ArtistIllustration } from "src/prisma/models";

export default class IllustrationResponse extends OmitType(ArtistIllustration, ['artistId', 'id']) {
	@ApiProperty({
		description: "URL to the illustration",
		example: "/illustrations/(artists|albums|releases|songs|tracks)/123"
	})
	url: string;
}
