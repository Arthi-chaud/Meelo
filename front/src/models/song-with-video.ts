import Song, { SongInclude, SongRelations } from "./song";
import Track from "./track";
import * as yup from 'yup';

const SongWithVideo = Song.concat(yup.object({
	video: Track.required()
}));

type SongWithVideo = yup.InferType<typeof SongWithVideo>;

const SongWithVideoWithRelations = <Selection extends SongInclude | never = never>(
	relation: Selection[]
) => SongWithVideo.concat(SongRelations.pick(relation));

type SongWithVideoWithRelations<Selection extends SongInclude | never = never> =
 yup.InferType<ReturnType<typeof SongWithVideoWithRelations<Selection>>>

export default SongWithVideo;
export { SongWithVideoWithRelations };
