/*
 * Meelo is a music server and application to enjoy your personal music files anywhere, anytime you want.
 * Copyright (C) 2023
 *
 * Meelo is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meelo is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import store, { RootState } from "../../state/store";
import Action from "./action";
import { TranslateIcon } from "../icons";
import { Language, Languages } from "../../i18n/i18n";
import { setLanguage } from "../../state/settingsSlice";
import { TranslationKey } from "../../i18n/translations/type";

const getLanguageDisplayName = (ln: Language) => {
	switch (ln) {
		case "en":
			return "English";
		case "fr":
			return "French";
	}
};

const ChangeLanguageAction = (
	selectedLanguage: RootState["settings"]["language"],
): Action => {
	const baseAction = {
		icon: <TranslateIcon />,
	};
	let nextLanguageIndex =
		Languages.findIndex((ln) => ln == selectedLanguage) + 1;

	if (selectedLanguage == Languages.at(-1)) {
		nextLanguageIndex = 0;
	}

	return {
		...baseAction,
		label: `Switch to ${getLanguageDisplayName(
			Languages.at(nextLanguageIndex)!,
		)}` as TranslationKey,
		onClick: () =>
			store.dispatch(setLanguage(Languages.at(nextLanguageIndex)!)),
	};
};

export default ChangeLanguageAction;
