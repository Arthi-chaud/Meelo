import { RequireExactlyOne } from "type-fest";
import { TranslationKey } from "../../i18n/translations/type";

/**
 * Props for a generic component to run an action/go to page
 */
type Action = {
	disabled?: boolean;
	onClick?: () => void;
	label: TranslationKey;
	icon?: JSX.Element;
} & Partial<RequireExactlyOne<{
	href: string;
	dialog: (controls: { close: () => void }) => JSX.Element;
}>>

export default Action;
