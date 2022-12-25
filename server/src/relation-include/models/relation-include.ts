/**
 * A record to request relations to be included in an object from the database
 * If a field is undefined, it would be considered as not requested
 */
export type RelationInclude<T extends readonly string[]> = Partial<Record<T[number], boolean>>;
