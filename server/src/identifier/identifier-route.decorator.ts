import { ApiParam } from "@nestjs/swagger";

/**
 * Controller method decorator to describe 'idOrSlug' route parameter
 */
export function ApiIdentifierRoute() {
	return ApiParam({
		name: 'idOrSlug',
		description: "Identifier of the resource to fetch. Can be a number or a slug <br><br>\
		Examples: 123, 'artist-slug', 'artist-slug+album-slug', 'artist-slug+album-slug+release-slug'",
	});
}
