import MapValidator from "../utils/map-validator";
import Song, { SongInclude, SongRelations } from "./song";
import Track from "./track";
import * as yup from "yup";

const Tracklist = <Selection extends SongInclude | never>(
	selection: Selection[],
) =>
	MapValidator(
		yup.string().required(),
		yup
			.array(
				Track.concat(
					yup.object({
						song: Song.concat(SongRelations.pick(selection)),
					}),
				).required(),
			)
			.required(),
	);

type Tracklist<T extends Track> = Record<string | "?", T[]>;

export default Tracklist;
