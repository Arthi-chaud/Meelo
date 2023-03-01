import { InvalidRequestException } from "src/exceptions/meelo-exception";

export class ProviderMethodNotAvailableError extends InvalidRequestException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Method not available`);
	}
}

export class UnknownProviderError extends InvalidRequestException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Provider is unknown`);
	}
}
