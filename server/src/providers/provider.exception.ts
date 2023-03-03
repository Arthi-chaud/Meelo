import { InvalidRequestException, NotFoundException } from "src/exceptions/meelo-exception";
import ProviderActions from "./provider-actions";

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
	constructor(providerName: string, actionName: keyof ProviderActions, message: string) {
		super(`Provider '${providerName}' '${actionName}' Failed: ${message}`);
	}
}

export class AllProvidersFailedError extends NotFoundException {
	constructor() {
		super("All Providers Failed at task");
	}
}
