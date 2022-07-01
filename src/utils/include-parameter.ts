/**
 * Defines if a relation should be returned in a fetched object
 * Also allow to fetch relations of the relation
 */
export type IncludeParameter<T> = boolean | T;

/**
 * Build the include parameter for the ORM
 * @param recursiveIncludeBuilder the function use to build the recusrive include parameter
 * @param include the include parameter
 * @returns the ORM-ready include parameter
 */
export function buildIncludeParameter<T>(recursiveIncludeBuilder: (include: T) => any, include?: IncludeParameter<T>) {
	if (typeof include == "boolean")
		return include;
	if (include === undefined)
		return false;
	return {
		include: recursiveIncludeBuilder(include)
	};
}