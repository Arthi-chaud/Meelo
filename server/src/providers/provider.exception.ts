import { InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";

export class ProviderMethodNotAvailableError extends InvalidRequestException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Method not available`);
	}
}

export class UnknownProviderError extends NotFoundException {
	constructor(providerName: string) {
		super(`Provider ${providerName}: Provider is unknown`);
	}
}

export class ProviderActionFailedError extends NotFoundException {
	constructor(providerName: string, actionName: string, message: string) {
		super(`Provider '${providerName}' '${actionName}' Failed: ${message}`);
	}
}

export class MissingExternalIdError extends NotFoundException {
	constructor(providerName: string, resourceType: string, resourceName: string) {
		super(`Could not find External Id from ${providerName} not found for ${resourceType} '${resourceName}'.`);
	}
}

export class AllProvidersFailedError extends NotFoundException {
	constructor() {
		super("All Providers Failed at task");
	}
}
