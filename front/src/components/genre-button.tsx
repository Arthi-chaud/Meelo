import Link from "next/link";
import Genre from "../models/genre";
import { Chip } from "@mui/material";

type GenreButtonProps = {
	genre: Pick<Genre, 'name' | 'slug'>,
	color?: string
}

const GenreButton = (props: GenreButtonProps) => {
	return <Link href={`/genres/${props.genre.slug}`}>
		<Chip variant="outlined" clickable label={props.genre.name}
			sx={props.color ? { borderColor: props.color } : { color: 'primary' }}
		/>
	</Link>;
};

export default GenreButton;

