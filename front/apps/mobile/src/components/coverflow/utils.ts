export type Sensitivity = "low" | "normal" | "high";
export type Deceleration = "normal" | "fast";

export const convertSensitivity = (sensitivity: Sensitivity) => {
	switch (sensitivity) {
		case "low":
			return 120;
		case "high":
			return 40;
		case "normal":
		default:
			return 60;
	}
};

export const convertDeceleration = (deceleration: Deceleration) => {
	"worklet";
	switch (deceleration) {
		case "fast":
			return 0.99;
		case "normal":
		default:
			return 0.994;
	}
};

export const orderChildren = <T>(
	data: T[],
	selection: number,
): [number, T][] => {
	const children: [number, T][] = [];
	selection = Math.min(selection, data.length - 1);

	if (data.length === 0) {
		return [];
	}

	// First the children before selection
	for (let i = 0; i < selection; i += 1) {
		children.push([i, data[i]]);
	}

	// Next the children after selection in reverse order
	for (let i = data.length - 1; i > selection; i -= 1) {
		children.push([i, data[i]]);
	}

	// Finally the selection at the top
	children.push([selection, data[selection]]);

	return children;
};
export const clamp = (value: number, min: number, max: number) => {
	if (value < min) {
		return min;
	}

	if (value > max) {
		return max;
	}

	return value;
};
