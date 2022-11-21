import { NextRequest, NextResponse } from 'next/server';
import API from './api';
import { AlbumWithArtist } from './models/album';

export async function middleware(request: NextRequest) {
	const { pathname, origin } = request.nextUrl;
	// eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain, no-useless-escape
	const albumId = pathname.match('\/albums\/(?<slug>[^\/]*)')?.at(1)!;
	const album = await API.getAlbum<AlbumWithArtist>(albumId, ['artist']);
	const master = await API.getMasterRelease(album.id);

	return NextResponse.rewrite(`${origin}/releases/${album.artist?.slug ?? 'compilations'}+${album.slug}+${master.slug}`);
}

export const config = {
	matcher: '/albums/:slugOrId/',
};
