import { NextRequest, NextResponse } from 'next/server';
import API from './api/api';
import store from './state/store';
import { setAccessToken } from './state/userSlice';
import UserAccessTokenCookieKey from './utils/user-access-token-cookie-key';
// eslint-disable-next-line no-restricted-imports
import { QueryClient } from 'react-query';
import { prepareMeeloQuery } from './api/use-query';

export async function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;
	const accessToken = request.cookies.get(UserAccessTokenCookieKey);
	const queryClient = new QueryClient();

	if (accessToken) {
		store.dispatch(setAccessToken(accessToken));
	} else {
		// Disable SSR if user is not authentified
		return NextResponse.redirect(`${origin}/`);
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain, no-useless-escape
	const albumId = pathname.match('\/albums\/(?<slug>[^\/]*)')?.at(1)!;
	const album = await queryClient.fetchQuery(
		prepareMeeloQuery((id) => API.getAlbum(id, ['artist']), albumId)
	);
	const master = await queryClient.fetchQuery(prepareMeeloQuery(API.getMasterRelease, album.id));

	return NextResponse.rewrite(`${origin}/releases/${album.artist?.slug ?? 'compilations'}+${album.slug}+${master.slug}`);
}

export const config = {
	matcher: '/albums/:slugOrId/',
};
