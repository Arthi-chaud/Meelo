import { Box, Stack } from "@mui/material";
import Tile from "./tile/tile";

type TileRowProps = {
	tiles: ReturnType<typeof Tile>[];
}

const TileRow = (props: TileRowProps) => {
	const width = { xs: '50%', sm: 100/3 + '%', md: '20%', lg: 100/6 +'%' };

	return <Stack sx={{ overflowX: 'scroll', paddingBottom: 1 }} direction='row'>
		{props.tiles.map((tile, tileIndex) =>
			<Box key={tileIndex} sx={{ paddingRight: 2, minWidth: width, maxWidth: width }}>
				{tile}
			</Box>)
		}
	</Stack>;
};

export default TileRow;
