export const LayoutOptions = ['grid', 'list'] as const;

export type LayoutOption = typeof LayoutOptions[number];

export const getLayoutParams = (input: any) => {
	for (const layout of LayoutOptions) {
		if (input?.toLowerCase() === layout) {
			return layout;
		}
	}
	return undefined;
};
