export default function countDefinedFields(
	o: Object,
	ignoreKeys: string[] = [],
) {
	return Object.entries(o).filter(
		([k, v]) => !ignoreKeys.includes(k) && v !== undefined,
	).length;
}

export function removeUndefinedFields(o: Object) {
	return Object.fromEntries(
		Object.entries(o).filter(([_, v]) => v !== undefined),
	);
}
