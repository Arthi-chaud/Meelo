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

// eslint-disable-next-line no-restricted-imports
import type { NextPageContext } from "next";
// eslint-disable-next-line no-restricted-imports
import type { QueryClient } from "react-query";
import type { InfiniteQuery, Query } from "./api/use-query";
import type { ComponentType } from "react";

type PromiseOr<T> = T | Promise<T>;

export type Page<Props = unknown> = ComponentType<{
	props: Props | undefined;
}> & {
	prepareSSR: (
		ctxt: NextPageContext,
		queryClient: QueryClient,
	) => PromiseOr<{
		/**
		 * Queries to prefetch
		 */
		queries?: Query<any>[];
		/**
		 * Infinite Queries to prefetch
		 */
		infiniteQueries?: InfiniteQuery<any>[];
		additionalProps?: Props;
	}>;
};

export type GetPropsTypesFrom<T> = T extends (
	ctxt: NextPageContext,
	queryClient: QueryClient,
) => infer P
	? P extends PromiseOr<{ additionalProps: infer Q }>
		? Q
		: never
	: never;
