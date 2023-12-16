import { Avatar } from "@mui/material";
import Artist from "../models/artist";
import Illustration from "./illustration";

const ArtistAvatar = (props: {
	artist: Artist;
	quality: Parameters<typeof Illustration>[0]["quality"];
}) => {
	return (
		<Avatar
			alt={props.artist.slug}
			sx={{
				width: "100%",
				height: "100%",
				background: "none",
				objectFit: "cover",
			}}
		>
			<Illustration
				imgProps={{ objectFit: "cover" }}
				illustration={props.artist.illustration}
				quality={props.quality}
			/>
		</Avatar>
	);
};

export default ArtistAvatar;
