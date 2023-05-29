import Song, { SongInclude, SongRelations } from "./song";
import Track from "./track";
import * as yup from 'yup';

const Video = Song.concat(yup.object({
	track: Track.required()
}));

type Video = yup.InferType<typeof Video>;

const VideoWithRelations = <Selection extends SongInclude | never = never>(
	relation: Selection[]
) => Video.concat(SongRelations.pick(relation));

type VideoWithRelations<Selection extends SongInclude | never = never> =
 yup.InferType<ReturnType<typeof VideoWithRelations<Selection>>>

export default Video;
export { VideoWithRelations };
