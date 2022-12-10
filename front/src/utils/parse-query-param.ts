/**
 * Parses query param from router, comparing with an array of valid values
 */
const parseQueryParam = (
	input: any, optionValues: readonly string[]
): string => {
	if (Array.isArray(input)) {
		input = input[0];
	}
	for (const option of optionValues) {
		if (input === option) {
			return option;
		}
	}
	return optionValues[0];
};

export default parseQueryParam;
