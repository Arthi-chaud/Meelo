import MapValidator from '../utils/map-validator';
import Track, { TrackInclude, TrackWithRelations } from './track';
import * as yup from 'yup';

const Tracklist = <Selection extends TrackInclude | never>(selection: Selection[]) =>
	MapValidator(
		yup.string().required(),
		yup.array(TrackWithRelations(selection).required()).required()
	);

type Tracklist<T extends Track> = Record<string | '?', T[]>;

export default Tracklist;
