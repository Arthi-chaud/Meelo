import { ApiProperty } from "@nestjs/swagger";

export class IllustratedModel {
	@ApiProperty({
		description: 'URL to related illustration',
		example: '/illustrations/(artists|albums|releases|songs|tracks)/123'
	})
	illustration: string | null;
}
