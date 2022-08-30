import {IconButton} from "@mui/material";
import {AccountCircle, Album} from "@mui/icons-material";
import API from "../../api";
import Tile from "./tile";
import { AlbumWithArtist } from "../../models/album";

const AlbumTile = (props: { album: AlbumWithArtist }) => {
	return <Tile
		title={props.album.name}
		subtitle={props.album.artist?.name}
		targetURL={`/albums/${props.album.artist?.slug ?? 'compilations'}+${props.album.slug}`}
		illustrationURL={API.getIllustrationURL(props.album.illustration)}
		illustrationFallback={() => 
			<IconButton disableFocusRipple disableRipple sx={{ '& svg': {fontSize: 100} }}>
				<Album />
			</IconButton>
		}
	/>
}

export default AlbumTile;