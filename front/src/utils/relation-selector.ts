type RelationSelector<Keys extends string> = Record<Keys, true>;

export type ArrayRelationSelector<Selection extends Keys[], Keys extends string> =
	RelationSelector<Selection[number]>;

const arrayToRelationSelector = <Keys extends string>(array: Keys[]): RelationSelector<Keys> =>
	array.reduce(
		(previous, curr) => ({ ...previous, [curr]: true }),
		{} as RelationSelector<Keys>
	);

export default RelationSelector;
export { arrayToRelationSelector };
