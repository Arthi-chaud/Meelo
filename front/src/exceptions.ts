/**
 * Base Exception class
 */
export class MeeloException extends Error {
	constructor(message: string) {
		super(message);
	}
}

/**
 * Exception on resource not found
 * If caught by ErrorBoundary, renders 404 page
 */
export class ResourceNotFound extends MeeloException {
	constructor(message: string) {
		super(message);
	}
}
