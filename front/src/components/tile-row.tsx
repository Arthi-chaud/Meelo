import { Box, Stack } from "@mui/material";
import Tile from "./tile/tile";

type TileRowProps = {
	tiles: ReturnType<typeof Tile>[];
}

const TileRow = (props: TileRowProps) => {
	return <Stack sx={{ overflowX: 'scroll', paddingBottom: 1 }} direction='row'>
		{props.tiles.map((tile, tileIndex) => {
			return <Box key={tileIndex} sx={{ paddingRight: 2,
				minWidth: { xs: '50%', sm: '33%', md: '20%', lg: '15%' } }}
			>{tile}</Box>;
		})}
	</Stack>;
};

export default TileRow;
