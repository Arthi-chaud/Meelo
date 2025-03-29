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
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "api/use-query";
import type Playlist from "models/playlist";
import {
	DeletePlaylistAction,
	UpdatePlaylistAction,
} from "components/actions/playlist";
import { SharePlaylistAction } from "components/actions/share";
import { UpdatePlaylistIllustrationAction } from "components/actions/update-illustration";
import { ContextualMenu } from "..";

type PlaylistContextualMenuProps = {
	playlist: Playlist;
	onSelect?: () => void;
};

const PlaylistContextualMenu = (props: PlaylistContextualMenuProps) => {
	const queryClient = useQueryClient();
	const confirm = useConfirm();
	const router = useRouter();
	const { t } = useTranslation();

	return (
		<ContextualMenu
			onSelect={props.onSelect}
			actions={[
				[UpdatePlaylistAction(props.playlist, queryClient)],
				[
					UpdatePlaylistIllustrationAction(
						queryClient,
						props.playlist.id,
					),
				],
				[SharePlaylistAction(props.playlist.slug, t)],
				[
					DeletePlaylistAction(
						confirm,
						queryClient,
						props.playlist.slug,
						() => router.push("/playlists"),
					),
				],
			]}
		/>
	);
};

export default PlaylistContextualMenu;
