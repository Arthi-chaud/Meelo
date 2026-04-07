import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";
import { getCurrentUserStatus } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import type User from "@/models/user";
import { store } from "@/state/store";
import { useAPI } from "~/api";
import { queryClientAtom } from "~/state/query-client";
import { AnonynmousAccessToken, accessTokenAtom } from "~/state/user";

export type UserState =
	| { type: "anonymous"; user: null }
	| { type: "authed"; user: User }
	| { type: "unknown"; user: null; error: string | null }
	| { type: "loading"; user: null };

export const useUser = (): UserState => {
	const token = useAtomValue(accessTokenAtom);
	const api = useAPI();
	const { data: user, error } = useQuery({
		...toTanStackQuery(api, getCurrentUserStatus),
		throwOnError: token !== AnonynmousAccessToken,
		enabled: token !== undefined && token !== AnonynmousAccessToken,
	});
	return getUser_(token, user, error);
};

export const getUser = () => {
	const user = store
		.get(queryClientAtom)
		.getQueryData<User>(getCurrentUserStatus().key);
	return getUser_(store.get(accessTokenAtom), user, null);
};

const getUser_ = (
	token: string | undefined,
	user: User | undefined,
	error: Error | undefined | null,
): UserState => {
	if (token === AnonynmousAccessToken) {
		return { type: "anonymous", user: null };
	}
	if (!token) {
		return { type: "unknown", user: null, error: null };
	}
	if (error) {
		return { type: "unknown", user: null, error: error.message };
	}
	if (user === undefined) {
		return { type: "loading", user: null };
	}
	return { type: "authed", user };
};
