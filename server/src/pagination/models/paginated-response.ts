import { ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';
import InvalidPaginationParameterValue from '../pagination.exceptions';
import { defaultPageSize } from './pagination-parameters';

class PaginationMetadata {
	@ApiProperty({
		description: 'The current URL'
	})
	this: string;

	@ApiProperty({
		description: 'The URL of the next page, if there is one',
		type: String,
		nullable: true
	})
	next: string | null;

	@ApiProperty({
		description: 'The URL of the previous page, if there is one',
		type: String,
		nullable: true
	})
	previous: string | null;

	@ApiProperty({
		description: 'The index of the page, if there is one',
		type: Number,
		nullable: true,
		example: 3
	})
	page: number | null;
}

export default class PaginatedResponse<T extends { id: number }> {
	@ApiProperty()
	metadata: PaginationMetadata;

	@ApiProperty({ type: Array })
	items: T[];

	static async awaiting<P extends { id: number }>(items: Promise<P>[], request: Request | any) {
		return new PaginatedResponse<P>(
			await Promise.all(items),
			request
		);
	}

	constructor(items: T[], request: Request | any) {
		this.items = items;
		const route: string = request.path;
		const itemsCount = items.length;
		const take = Number(request.query['take'] ?? defaultPageSize).valueOf();
		const afterId = Number(request.query['afterId']).valueOf();

		if (take == 0) {
			throw new InvalidPaginationParameterValue('take');
		}
		let skipped: number = Number(request.query['skip'] ?? 0).valueOf();

		if (!isNaN(afterId)) {
			this.metadata = {
				this: this.buildUrl(route, request.query),
				next: itemsCount >= take
					? this.buildUrl(route, {
						...request.query,
						afterId: items.at(-1)?.id ?? null
					})
					: null,
				previous: null,
				page: null
			};
			return;
		}
		const currentPage = 1 + Math.floor(skipped / take);

		if (skipped % take) {
			skipped += take - skipped % take;
		}
		this.metadata = {
			this: this.buildUrl(route, request.query),
			next: itemsCount >= take
				? this.buildUrl(route, {
					...request.query,
					skip: skipped + take
				})
				: null,
			previous: skipped
				? this.buildUrl(route, {
					...request.query,
					skip: Math.max(0, skipped - take)
				})
				: null,
			page: itemsCount ? currentPage : null,
		};
	}

	private buildUrl(route: string, queryParameters: any) {
		if (queryParameters.skip == 0) {
			delete queryParameters.skip;
		}
		const builtQueryParameters = new URLSearchParams(queryParameters).toString();

		if (builtQueryParameters.length) {
			return `${route}?${builtQueryParameters}`;
		}
		return route;
	}
}
