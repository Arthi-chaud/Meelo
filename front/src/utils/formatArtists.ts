import Artist from "../models/artist";

const formatArtists = (
	artist: Pick<Artist, "name">,
	featuring?: Pick<Artist, "name">[],
): string => {
	if (!featuring || featuring.length == 0) {
		return artist.name;
	}
	const [firstFeat, ...otherFeats] = featuring;

	if (otherFeats.length == 0) {
		return `${artist.name} & ${firstFeat.name}`;
	}
	return `${artist.name}, ${featuring
		.map(({ name }) => name)
		.slice(0, -1)
		.join(", ")} & ${featuring.at(-1)?.name}`;
};

export default formatArtists;
