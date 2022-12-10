/**
 * Parses query param from router, comparing with an array of valid values
 */
const parseQueryParam = <Keys extends readonly string[]>(
	input: any, optionValues: Keys
): Keys[number] => {
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
