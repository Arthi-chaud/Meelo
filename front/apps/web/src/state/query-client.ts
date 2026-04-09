import { QueryClient } from "@tanstack/react-query";
import { atom } from "jotai";
import { DefaultQueryOptions } from "@/api/query";

export const queryClientAtom = atom(
	new QueryClient({
		defaultOptions: {
			queries: DefaultQueryOptions,
		},
	}),
);
