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

import { atom, useAtom } from "jotai";
import API from "@/api";
import {
	mkUseInfiniteQuery,
	mkUseQueries,
	mkUseQuery,
	mkUseQueryClient,
} from "@/api/hook";
import type { InfiniteQueryFn, QueryFn } from "@/api/query";
import type Resource from "@/models/resource";
import { store } from "@/state/store";
import { accessTokenAtom } from "~/state/user";

const isSSR = () => typeof window === "undefined";

const apiInstancesAtom = atom({} as Record<string, API>);

export const useAPI = () => {
	const [accessToken] = useAtom(accessTokenAtom);
	const [apiInstances, setApiInstances] = useAtom(apiInstancesAtom);
	if (!accessToken) {
		return getAPI_(null);
	}
	const matchingInstance = apiInstances[accessToken];
	if (!matchingInstance) {
		const newInstance = getAPI_(accessToken);
		setApiInstances((rest) => ({ ...rest, [accessToken]: newInstance }));
		return newInstance;
	}
	return matchingInstance;
};

// Get API instance using atom to resolve access token
export const getAPI = () => {
	const accessToken = store.get(accessTokenAtom);
	return getAPI_(accessToken ?? null);
};

export const getAPI_ = (accessToken: string | null) => {
	const isDev = process.env.NODE_ENV === "development";
	const apiSSRUrl =
		process.env.SSR_SERVER_URL ?? process.env.PUBLIC_SERVER_URL!;

	const api = new API(accessToken, {
		illustration: isDev
			? "/api"
			: (process.env.PUBLIC_SERVER_URL ?? "/api"),
		api: isSSR()
			? apiSSRUrl
			: isDev
				? "/api"
				: (process.env.PUBLIC_SERVER_URL ?? "/api"),

		scanner: isSSR()
			? (process.env.SSR_SCANNER_URL ?? process.env.PUBLIC_SCANNER_URL!)
			: isDev
				? "/scanner"
				: (process.env.PUBLIC_SCANNER_URL ?? "/scanner"),
		matcher: isSSR()
			? (process.env.SSR_MATCHER_URL ??
				process.env.PUBLIC_MATCHER_URL ??
				"") // For retrocompatibility
			: isDev
				? "/matcher"
				: (process.env.PUBLIC_MATCHER_URL ?? "/matcher"),
	});
	return api;
};

/**
 * Wrapper for the react-query's *useQuery*
 */
export const useQuery = <
	ReturnType,
	Params extends any[],
	Transformed = ReturnType,
>(
	query: QueryFn<ReturnType, Transformed, Params>,
	...queryParams: Partial<Params>
) => {
	return mkUseQuery(useAPI, query, ...queryParams);
};

/**
 * Wrapper for the react-query's *useQueries*
 */
export const useQueries = <ReturnType, Params extends any[][]>(
	...queries: readonly Parameters<
		typeof useQuery<ReturnType, Params[number], ReturnType>
	>[]
) => {
	return mkUseQueries<ReturnType, Params>(useAPI, ...(queries as any));
};

/**
 * Wrapper for the react-query's *useInfiniteQuery*
 */
export const useInfiniteQuery = <
	ReturnType extends Resource,
	Params extends any[],
	TransformedType = ReturnType,
>(
	query: InfiniteQueryFn<ReturnType, TransformedType, Params>,
	...queryParams: Partial<Params>
) => {
	return mkUseInfiniteQuery(useAPI, query, ...queryParams);
};

export const useQueryClient = () => mkUseQueryClient(getAPI);
