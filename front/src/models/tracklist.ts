import Track from './track';

type Tracklist<T extends Track = Track> = Map<string | '?', T[]>;

export default Tracklist;
