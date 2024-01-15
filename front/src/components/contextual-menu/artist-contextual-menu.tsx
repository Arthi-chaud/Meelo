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

import Artist from "../../models/artist";
import ContextualMenu from "./contextual-menu";
import {
	GoToArtistAction,
	GoToArtistAlbumsAction,
	GoToArtistSongsAction,
} from "../actions/link";
import { ShareArtistAction } from "../actions/share";
import { UpdateArtistIllustrationAction } from "../actions/update-illustration";
import { useQueryClient } from "../../api/use-query";
import { useTranslation } from "react-i18next";

type ArtistContextualMenuProps = {
	artist: Artist;
};

const ArtistContextualMenu = (props: ArtistContextualMenuProps) => {
	const artistSlug = props.artist.slug;
	const queryClient = useQueryClient();
	const { t } = useTranslation();

	return (
		<ContextualMenu
			actions={[
				[
					GoToArtistAction(artistSlug),
					GoToArtistAlbumsAction(artistSlug),
					GoToArtistSongsAction(artistSlug),
				],
				[UpdateArtistIllustrationAction(queryClient, props.artist.id)],
				[ShareArtistAction(artistSlug, t)],
			]}
		/>
	);
};

export default ArtistContextualMenu;
