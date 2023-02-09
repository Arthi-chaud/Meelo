import { z } from 'zod';
import Track from './track';

const Tracklist = z.map(
	z.union([z.literal('?'), z.number()]),
	Track.array()
);
//TODO Use Templates
type Tracklist = z.infer<typeof Tracklist>;

export default Tracklist;
