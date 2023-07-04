import { OmitType } from "@nestjs/swagger";
import { ArtistIllustration } from "src/prisma/models";

export default class IllustrationResponse extends OmitType(ArtistIllustration, ['artistId']) {}
