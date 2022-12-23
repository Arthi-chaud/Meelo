import { Param } from "@nestjs/common";
import ParseIdentifierPipe from './identifier.pipe';

/**
 * Decorator for a resource identifier
 * @param pipe the pipe to transform the identifier into an `Identifier`
 */
export function IdentifierParam() {
	return Param('idOrSlug', ParseIdentifierPipe);
}
