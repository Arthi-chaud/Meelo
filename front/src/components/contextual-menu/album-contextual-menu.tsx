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

import { useConfirm } from "material-ui-confirm";
import API from "../../api/api";
import { DownloadReleaseAsyncAction } from "../actions/download";
import { GoToArtistAction } from "../actions/link";
import { ShareAlbumAction } from "../actions/share";
import ContextualMenu from "./contextual-menu";
import { AlbumWithRelations } from "../../models/album";
import { useQueryClient } from "../../api/use-query";
import ChangeAlbumType from "../actions/album-type";
import { RefreshAlbumMetadataAction } from "../actions/refresh-metadata";

type AlbumContextualMenuProps = {
	album: AlbumWithRelations<"artist">;
};

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = `${props.album.artist?.slug ?? "compilations"}+${
		props.album.slug
	}`;
	const confirm = useConfirm();
	const queryClient = useQueryClient();

	return (
		<ContextualMenu
			actions={[
				[
					...(props.album.artist
						? [GoToArtistAction(props.album.artist.slug)]
						: []),
				],
				[
					ChangeAlbumType(props.album, queryClient, confirm),
					RefreshAlbumMetadataAction(albumSlug),
				],
				[
					DownloadReleaseAsyncAction(confirm, () =>
						queryClient
							.fetchQuery(API.getMasterRelease(albumSlug))
							.then((release) => release.id),
					),
				],
				[ShareAlbumAction(albumSlug)],
			]}
		/>
	);
};

export default AlbumContextualMenu;
