import { NextRequest, NextResponse } from "next/server";
import API from "./api/api";
import store from "./state/store";
import { setAccessToken } from "./state/userSlice";
import { UserAccessTokenCookieKey } from "./utils/cookieKeys";
// eslint-disable-next-line no-restricted-imports
import { QueryClient } from "react-query";
import { prepareMeeloQuery } from "./api/use-query";

export async function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;
	const accessToken = request.cookies.get(UserAccessTokenCookieKey)?.value;
	const queryClient = new QueryClient();

	if (accessToken) {
		store.dispatch(setAccessToken(accessToken));
	} else {
		// Disable SSR if user is not authentified
		return NextResponse.redirect(`${origin}/`);
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain, no-useless-escape
	const albumId = pathname.match("/albums/(?<slug>[^/]*)")?.at(1)!;
	const master = await queryClient
		.fetchQuery(prepareMeeloQuery(API.getMasterRelease, albumId))
		.catch(() => null);

	if (!master) {
		// From https://github.com/vercel/next.js/discussions/30682#discussioncomment-3348330
		const url = request.nextUrl.clone();

		url.pathname = `/404`;
		return NextResponse.rewrite(url);
	}
	return NextResponse.rewrite(`${origin}/releases/${master.id}`);
}

export const config = {
	matcher: "/albums/:slugOrId/",
};
