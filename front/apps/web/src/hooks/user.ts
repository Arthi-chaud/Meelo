import { useAtomValue } from "jotai";
import { getCurrentUserStatus } from "@/api/queries";
import type User from "@/models/user";
import { useQuery } from "~/api";
import { AnonynmousAccessToken, accessTokenAtom } from "~/state/user";

export type UserState =
	| { type: "anonymous"; user: null }
	| { type: "authed"; user: User }
	| { type: "unknown"; user: null; error: string | null }
	| { type: "loading"; user: null };

export const useUser = (): UserState => {
	const token = useAtomValue(accessTokenAtom);
	if (token === AnonynmousAccessToken) {
		return { type: "anonymous", user: null };
	}
	if (!token) {
		return { type: "unknown", user: null, error: null };
	}
	const { data: user, error } = useQuery(getCurrentUserStatus);
	if (error) {
		return { type: "unknown", user: null, error: error.message };
	}
	if (user === undefined) {
		return { type: "loading", user: null };
	}
	return { type: "authed", user };
};
