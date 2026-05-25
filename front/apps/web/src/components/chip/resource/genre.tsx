import type { ComponentProps } from "react";
import type Genre from "@/models/genre";
import Chip from "..";

export const GenreChip = ({
	genre,
	...props
}: { genre: Genre | undefined } & Omit<
	ComponentProps<typeof Chip>,
	"label" | "href"
>) => <Chip {...props} label={genre?.name} href={`/genres/${genre?.slug}`} />;
