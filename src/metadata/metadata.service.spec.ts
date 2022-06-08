import { Test } from "@nestjs/testing";
import { MetadataModule } from "./metadata.module";
import { MetadataService } from "./metadata.service";

describe('Metadata Service', () => {
	let metadataService: MetadataService

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [MetadataService],
		}).compile();
		metadataService = moduleRef.get<MetadataService>(MetadataService);
	})

	it('should parse the metadata from the file path', () => {

	})
})