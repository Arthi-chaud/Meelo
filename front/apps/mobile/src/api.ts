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

import { useAtom } from "jotai";
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
import { accessTokenAtom, instanceUrlAtom } from "~/state/user";

export const useAPI = () => {
	const [accessToken] = useAtom(accessTokenAtom);
	const [instanceUrl] = useAtom(instanceUrlAtom);
	return getAPI_(accessToken ?? null, instanceUrl ?? "");
};

// Get API instance using atom to resolve access token
export const getAPI = () => {
	const accessToken = store.get(accessTokenAtom);
	const instanceUrl = store.get(instanceUrlAtom);
	return getAPI_(accessToken ?? null, instanceUrl ?? "");
};

export const getAPI_ = (accessToken: string | null, instanceUrl: string) => {
	instanceUrl = instanceUrl.replace(/\/$/, "");
	const api = new API(accessToken, {
		api: `${instanceUrl}/api`,
		illustration: `${instanceUrl}/api`,
		scanner: `${instanceUrl}/scanner`,
		matcher: `${instanceUrl}/matcher`,
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
	return mkUseQuery(getAPI, query, ...queryParams);
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
