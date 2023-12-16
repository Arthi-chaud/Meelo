import { ApiProperty, OmitType } from "@nestjs/swagger";
import { ArtistIllustration } from "src/prisma/models";

export class IllustrationResponse extends OmitType(ArtistIllustration, [
	"artistId",
	"id",
]) {
	@ApiProperty({
		description: "URL to the illustration",
		example: "/illustrations/(artists|releases|tracks)/123",
	})
	url: string;
}

export class IllustratedResponse {
	@ApiProperty({ nullable: true })
	illustration: IllustrationResponse;
}
