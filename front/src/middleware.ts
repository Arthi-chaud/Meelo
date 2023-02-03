import { NextRequest, NextResponse } from 'next/server';
import API from './api/api';
import store from './state/store';
import { setAccessToken } from './state/userSlice';
import UserAccessTokenCookieKey from './utils/user-access-token-cookie-key';

export async function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;
	const accessToken = request.cookies.get(UserAccessTokenCookieKey);

	if (accessToken) {
		store.dispatch(setAccessToken(accessToken));
	} else {
		// Disable SSR if user is not authentified
		return NextResponse.redirect(`${origin}/`);
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain, no-useless-escape
	const albumId = pathname.match('\/albums\/(?<slug>[^\/]*)')?.at(1)!;
	const album = await API.getAlbum(albumId, ['artist']).exec();
	const master = await API.getMasterRelease(album.id).exec();

	return NextResponse.rewrite(`${origin}/releases/${album.artist?.slug ?? 'compilations'}+${album.slug}+${master.slug}`);
}

export const config = {
	matcher: '/albums/:slugOrId/',
};
