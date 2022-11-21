import { Box, Typography } from "@mui/material";

type LyricsProps = {
	lyrics?: string[] | null,
	songName: string
}
const LyricsBox = (props: LyricsProps) => {
	if (!props.lyrics) {
		return <Typography sx={{ fontStyle: 'italic' }}>
			No Lyrics found
		</Typography>;
	}
	return <Box flexDirection='column'>
		{props.lyrics.map((lyric, index) => {
			if (lyric.length == 0) {
				return <br key={index}/>;
			}
			const hasTitle = lyric
				.toLowerCase()
				.includes(props.songName.toLowerCase());
			const isSection = lyric
				.trim()
				.startsWith('[') && lyric.trim().endsWith(']');

			return <Typography key={index}
				variant={isSection ? 'caption' : 'body1'}
				style={{ fontWeight: hasTitle ? 'bold' : undefined }}
			>
				{lyric}
			</Typography>;
		})}
	</Box>;
};

export default LyricsBox;
