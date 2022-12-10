import parseQueryParam from "./parse-query-param";

export const LayoutOptions = ['grid', 'list'] as const;

export type LayoutOption = typeof LayoutOptions[number];

export const getLayoutParams = (input: any) => parseQueryParam(input, LayoutOptions);
