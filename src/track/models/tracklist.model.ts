import type { Track } from "src/prisma/models";

/**
 * Index to use if the disc index is unknown
 */
export const UnknownDiscIndexKey = '?';

type Tracklist = Map<string, Track[]>;
export default Tracklist;
