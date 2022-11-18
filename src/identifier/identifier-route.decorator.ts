import { ApiParam } from "@nestjs/swagger";

export function ApiIdentifierRoute() {
	return ApiParam({
		name: 'idOrSlug',
		description: 'Identitifer of the resource to fetch. Can be a number or a slug',
		example: "123, 'artist-slug', 'artist-slug+album-slug', 'artist-slug+album-slug+release-slug'"
	});
}
