import { InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";

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

export class ProviderActionFailedError extends NotFoundException {
	constructor(providerName: string, actionName: string, message: string) {
		super(`Provider '${providerName}' '${actionName}' Failed: ${message}`);
	}
}

export class AllProvidersFailedError extends NotFoundException {
	constructor(actionName: string) {
		super(`All providers failed action '${actionName}'`);
	}
}
