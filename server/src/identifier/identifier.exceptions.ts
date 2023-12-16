import { InvalidRequestException } from "src/exceptions/meelo-exception";
import Identifier from "./models/identifier";

export default class InvalidIdentifierSlugs extends InvalidRequestException {
	constructor(
		identifier: Identifier,
		expectedTokens: number,
		actualTokenCount: number,
	) {
		super(
			`Parsing slugs from identifier '${identifier}' failed: Expected ${expectedTokens} slugs, got ${actualTokenCount}`,
		);
	}
}
