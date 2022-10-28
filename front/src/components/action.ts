
/**
 * Props for a generic component to run an action/go to page
 */
type Action = {
	href?: string;
	disabled?: boolean;
	onClick?: () => void;
	label: string;
	icon?: JSX.Element;
}

export default Action;