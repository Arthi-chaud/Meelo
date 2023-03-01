import { InvalidRequestException } from "src/exceptions/meelo-exception";

export class ProviderMethodNotAvailable extends InvalidRequestException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Method not available`);
	}
}
