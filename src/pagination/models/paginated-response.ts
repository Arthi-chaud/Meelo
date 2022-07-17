import { ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import { defaultPageSize } from './pagination-parameters';

export default class PaginatedResponse<T> {
	@ApiProperty()
	metadata: Record<'this' | 'next' | 'previous', string | null>
			& { page: number | null };
	@ApiProperty({ type: Array })
	items: T[];
	constructor(items: T[], request: Request) {
		this.items = items;
		const host: string = request.headers['host']!;
		const route: string = request.route.path;
		const itemsCount = items.length;
		const take = Number(request.query['take'] ?? defaultPageSize).valueOf();
		const skipped: number = Number(request.query['skip'] ?? 0).valueOf();
		const currentPage = 1 + Math.floor(skipped / take);
		this.metadata = {
			this: this.buildUrl(host, route, request.query),
			next: itemsCount == take
				? this.buildUrl(host, route, {
					...request.query,
					skip: skipped + take
				})
				: null,
			previous: skipped
				? this.buildUrl(host, route, {
					...request.query,
					skip: Math.max(0, skipped - take)
				})
				: null,
			page: itemsCount ? currentPage : null,
		}
	}

	private buildUrl(host: string, route: string, queryParameters: any) {
		const baseUrl = `${host}${route}`
		const builtQueryParameters = new URLSearchParams(queryParameters).toString();
		if (builtQueryParameters.length)
			return `${baseUrl}?${builtQueryParameters}`;
		return baseUrl;
	}
}