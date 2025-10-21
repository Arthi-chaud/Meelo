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

import { QueryClient } from "@tanstack/react-query";
import { type NextRequest, NextResponse } from "next/server";
import { getMasterRelease } from "@/api/queries";
import { toTanStackQuery } from "@/api/query";
import { store } from "@/state/store";
import { UserAccessTokenStorageKey } from "@/utils/constants";
import { getAPI_ } from "~/api";
import { accessTokenAtom } from "~/state/user";

export async function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;
	const accessToken = request.cookies.get(UserAccessTokenStorageKey)?.value;
	const queryClient = new QueryClient();

	if (accessToken) {
		store.set(accessTokenAtom, accessToken);
	} else {
		// Disable SSR if user is not authentified
		return NextResponse.redirect(`${origin}/`);
	}
	const api = getAPI_(accessToken);
	if (pathname === "/scrobblers/lastfm/callback_handler") {
		const lastfmToken = request.nextUrl.searchParams.get("token");
		if (lastfmToken) {
			await api.postLastFMToken(lastfmToken).catch((e) => {
				// biome-ignore lint/suspicious/noConsole: Debug
				console.error(e);
			});
		}
		return NextResponse.redirect(`${origin}/settings`);
	}
	if (pathname === "/albums" || pathname === "/albums/") {
		return;
	}
	const albumId = pathname.match("/albums/(?<slug>[^/]*)")?.at(1)!;
	if (albumId === "compilations") {
		return;
	}
	const master = await queryClient
		.fetchQuery(toTanStackQuery(api, getMasterRelease, albumId))
		.catch(() => null);

	if (!master) {
		// From https://github.com/vercel/next.js/discussions/30682#discussioncomment-3348330
		const url = request.nextUrl.clone();

		url.pathname = "/404";
		return NextResponse.rewrite(url);
	}
	return NextResponse.rewrite(`${origin}/releases/${master.slug}`);
}

// Note putting the callback url in a variable make nextjs error:
// Unknown identifier "LastFMCallbackHandlerRoute" at "config.matcher[1]".
export const config = {
	matcher: ["/albums/(.*)", "/scrobblers/lastfm/callback_handler"],
};
