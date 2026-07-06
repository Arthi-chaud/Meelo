import type { QueryClient } from "@tanstack/react-query";
import { atom } from "jotai";

export const queryClientAtom = atom<QueryClient>();
