import * as yup from 'yup';
import Track from './track';

const Tracklist = yup.map(
	yup.union([yup.literal('?'), yup.number()]),
	Track.array()
);
//TODO Use Templates
type Tracklist = yup.InferType<typeof Tracklist>;

export default Tracklist;
