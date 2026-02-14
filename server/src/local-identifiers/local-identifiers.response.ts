import { ApiProperty, OmitType } from "@nestjs/swagger";
import { LocalIdentifiers } from "src/prisma/models";

export class LocalIdentifiersResponse extends OmitType(LocalIdentifiers, [
	"id",
	"artistId",
	"albumId",
	"songId",
	"releaseId",
]) {
	static from(
		localIdentifiers: LocalIdentifiers | null | undefined,
	): LocalIdentifiersResponse | null | undefined {
		if (!localIdentifiers) {
			return localIdentifiers;
		}

		return {
			musicbrainzId: localIdentifiers.musicbrainzId,
			discogsId: localIdentifiers.discogsId,
		};
	}
}

export class ResponseWithLocalIdentifiers {
	@ApiProperty({
		nullable: true,
		type: LocalIdentifiersResponse,
		description: "Use 'with' query parameter to include this field",
	})
	localIdentifiers?: LocalIdentifiersResponse | null | undefined;
}
