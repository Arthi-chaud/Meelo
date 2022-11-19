import Track from './track';

type Tracklist<T extends Track = Track> = Record<string | '?', T[]>;

export default Tracklist;
