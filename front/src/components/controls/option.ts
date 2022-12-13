/**
 * An option is a feature that can be controlled with a Controller
 */
type Option<Values extends readonly string[]> = {
	name: string;
	label?: string;
	icon?: JSX.Element;
	currentValue?: Values[number];
	values: Values;
}

export type OptionGroup<
	Options extends Option<OptionsKeys[number]>[],
	OptionsKeys extends readonly (readonly string[]) []
> = {
	name: string;
	icon?: JSX.Element;
	options: Options;
}

export default Option;
