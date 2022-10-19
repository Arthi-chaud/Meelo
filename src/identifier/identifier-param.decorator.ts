import { Param, PipeTransform, Type } from "@nestjs/common";

/**
 * Decorator for a resource identifier
 * @param pipe the pipe to transform the identifier into a 'WhereInput' object
 */
export function IdentifierParam(...pipes: (Type<PipeTransform> | PipeTransform)[]) {
	return Param('idOrSlug', ...pipes);
}