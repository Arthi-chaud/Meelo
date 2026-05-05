import { BaseSequencer, TestSpecification } from "vitest/node";

export default class CustomSequencer extends BaseSequencer {
	async sort(files: TestSpecification[]): Promise<TestSpecification[]> {
		return files.sort((a, b) => a.moduleId.localeCompare(b.moduleId));
	}
}
