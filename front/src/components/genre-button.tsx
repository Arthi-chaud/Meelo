import Link from "next/link";
import Genre from "../models/genre";
import { Chip } from "@mui/material";

type GenreButtonProps = {
	genre: Pick<Genre, 'name' | 'slug'>
}

const GenreButton = (props: GenreButtonProps) => {
	return <Link href={`/genres/${props.genre.slug}`}>
		<Chip variant="outlined" clickable label={props.genre.name} color="primary"/>
	</Link>;
};

export default GenreButton;

