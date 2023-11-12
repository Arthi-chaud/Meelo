export const isUndefined = <T>(item: T | undefined): item is undefined => {
	return item === undefined;
};

export const isDefined = <T>(item: T | undefined): item is T => {
	return !isUndefined(item);
};
