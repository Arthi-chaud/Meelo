/**
 * Filter an array of relation includes keys based on their names
 * @param keys the keys to filter
 * @param toKeep the keys to keep anyway
 * @returns the filtered keys
 */
export function filterAtomicRelationInclude<Key extends string>(
	keys: readonly Key[],
	toKeep?: Key[],
) {
	const keysCopy = Array.from(keys);

	return keysCopy.filter(
		(key) => toKeep?.includes(key) || !key.endsWith("s"),
	);
}
