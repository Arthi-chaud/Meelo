/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { ApiProperty } from "@nestjs/swagger";
import type { Request } from "express";
import InvalidPaginationParameterValue from "../pagination.exceptions";
import { defaultPageSize } from "./pagination-parameters";

class PaginationMetadata {
	@ApiProperty({
		description: "The number of returned items",
	})
	count: number;
	@ApiProperty({
		description: "The current URL",
	})
	this: string;

	@ApiProperty({
		description: "The URL of the next page, if there is one",
		type: String,
		nullable: true,
	})
	next: string | null;

	@ApiProperty({
		description: "The URL of the previous page, if there is one",
		type: String,
		nullable: true,
	})
	previous: string | null;

	@ApiProperty({
		description: "The index of the page, if there is one",
		type: Number,
		nullable: true,
		example: 3,
	})
	page: number | null;
}

export default class PaginatedResponse<
	T extends Record<PaginationKey, number>,
	PaginationKey extends string = "id",
> {
	@ApiProperty()
	metadata: PaginationMetadata;

	@ApiProperty({ type: Array })
	items: T[];

	static async awaiting<
		P extends Record<PaginationKey1, number>,
		PaginationKey1 extends string = "id",
	>(
		items: Promise<P>[],
		request: Request | any,
		paginationIdKey?: PaginationKey1,
	) {
		return new PaginatedResponse<P, PaginationKey1>(
			await Promise.all(items),
			request,
			paginationIdKey,
		);
	}

	constructor(
		items: T[],
		request: Request | any,
		paginationIdKey?: PaginationKey,
	) {
		this.items = items;
		const route: string = request.path;
		const itemsCount = items.length;
		const take = Number(request.query.take ?? defaultPageSize).valueOf();
		const afterId = Number(request.query.afterId).valueOf();

		if (take === 0) {
			throw new InvalidPaginationParameterValue("take");
		}
		let skipped: number = Number(request.query.skip ?? 0).valueOf();

		if (!Number.isNaN(afterId)) {
			this.metadata = {
				count: this.items.length,
				this: this.buildUrl(route, request.query),
				next:
					itemsCount >= take
						? this.buildUrl(route, {
								...request.query,
								afterId:
									items.at(-1)?.[
										(paginationIdKey ?? "id") as keyof T
									] ?? null,
							})
						: null,
				previous: null,
				page: null,
			};
			return;
		}
		const currentPage = 1 + Math.floor(skipped / take);

		if (skipped % take) {
			skipped += take - (skipped % take);
		}
		this.metadata = {
			count: this.items.length,
			this: this.buildUrl(route, request.query),
			next:
				itemsCount >= take
					? this.buildUrl(route, {
							...request.query,
							skip: skipped + take,
						})
					: null,
			previous: skipped
				? this.buildUrl(route, {
						...request.query,
						skip: Math.max(0, skipped - take),
					})
				: null,
			page: itemsCount ? currentPage : null,
		};
	}

	private buildUrl(route: string, queryParameters: any) {
		if (queryParameters.skip === 0) {
			delete queryParameters.skip;
		}
		const builtQueryParameters = new URLSearchParams(
			queryParameters,
		).toString();

		if (builtQueryParameters.length) {
			return `${route}?${builtQueryParameters}`;
		}
		return route;
	}
}
