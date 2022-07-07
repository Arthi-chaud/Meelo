/**
 * A record to request relations to be included in an object from the database
 */
export type RelationInclude<T extends readonly string[]> = Record<T[number], boolean>;
