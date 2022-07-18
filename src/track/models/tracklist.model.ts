import type { Track } from "@prisma/client";

/**
 * Index to use if the disc index is unknown
 */
export const UnknownDiscIndexKey = '?';

type Tracklist = Map<string, Track[]>;
export default Tracklist;