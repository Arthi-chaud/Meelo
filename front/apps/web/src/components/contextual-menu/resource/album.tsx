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
import { useTranslation } from "react-i18next";
import { getMasterRelease } from "@/api/queries";
import type { AlbumWithRelations } from "@/models/album";
import { useQueryClient } from "~/api";
import { DownloadReleaseAsyncAction } from "~/components/actions/download";
import { GoToAlbumAction, GoToArtistAction } from "~/components/actions/link";
import { PlayReleaseAction } from "~/components/actions/play-album";
import { RefreshAlbumMetadataAction } from "~/components/actions/refresh-metadata";
import { ChangeAlbumType } from "~/components/actions/resource-type";
import { ShareAlbumAction } from "~/components/actions/share";
import { ContextualMenu } from "..";

type AlbumContextualMenuProps = {
	album: AlbumWithRelations<"artist">;
};

const AlbumContextualMenu = (props: AlbumContextualMenuProps) => {
	const albumSlug = props.album.slug;
	const confirm = useConfirm();
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	return (
		<ContextualMenu
			actions={[
				[
					...(props.album.masterId
						? [PlayReleaseAction(props.album.masterId, queryClient)]
						: []),
				],
				[
					GoToAlbumAction(props.album.slug),
					...(props.album.artist
						? [GoToArtistAction(props.album.artist.slug)]
						: []),
				],
				[
					ChangeAlbumType(props.album, queryClient, confirm),
					RefreshAlbumMetadataAction(albumSlug, t),
				],
				[
					DownloadReleaseAsyncAction(
						queryClient.api,
						confirm,
						() =>
							queryClient
								.fetchQuery(getMasterRelease(albumSlug))
								.then((release) => release.id),
						t,
					),
				],
				[ShareAlbumAction(albumSlug, t)],
			]}
		/>
	);
};

export default AlbumContextualMenu;
