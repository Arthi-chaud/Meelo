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
	data: [number, T][],
	selection: number,
): [number, T][] => {
	return data.sort(([a], [b]) => {
		const aDist = Math.abs(a - selection);
		const bDist = Math.abs(b - selection);

		// center item last so it appears on top
		return bDist - aDist;
	});
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
