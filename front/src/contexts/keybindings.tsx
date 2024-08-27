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

import { createContext, useContext, useEffect, useState } from "react";
import { TranslationKey } from "../i18n/i18n";
import { useKey } from "react-use";
import { Handler } from "react-use/lib/useKey";

type BindingKey = "esc" | "?";

const bindingKeyToUseKeyParam = (bindingKey: BindingKey): string => {
	switch (bindingKey) {
		case "esc":
			return "Escape";
		case "?":
			return bindingKey;
	}
};

type Binding = {
	key: BindingKey;
	description: TranslationKey;
};

type BindingsState = {
	bindings: Binding[];
};

type KeyboardBindingsActions = {
	addBinding: (binding: BindingKey, description: TranslationKey) => void;
	removeBinding: (binding: BindingKey) => void;
};

const KeyboardBindings = createContext<BindingsState & KeyboardBindingsActions>(
	{
		bindings: [],
		addBinding: () => {},
		removeBinding: () => {},
	},
);

export const KeyboardBindingsProvider = (props: {
	children: JSX.Element[];
}) => {
	const [{ bindings }, setBindings] = useState<BindingsState>({
		bindings: [],
	});
	return (
		<KeyboardBindings.Provider
			value={{
				bindings,
				addBinding: (newBindingKey, description) => {
					setBindings((state) => {
						const bindingsCopy = Array.of(...state.bindings);
						const oldBinding = bindingsCopy.find(
							(b) => b.key == newBindingKey,
						);
						if (!oldBinding) {
							bindingsCopy.push({
								key: newBindingKey,
								description: description,
							});
							return { bindings: bindingsCopy };
						}
						if (oldBinding.description == description) {
							return state;
						}
						// eslint-disable-next-line no-console
						console.error(
							"Keyboard binding is probably getting duplicated.",
							{ newBindingKey, description },
						);
						oldBinding.description = description;
						return { bindings: bindingsCopy };
					});
				},
				removeBinding: (bindingKey) =>
					setBindings((state) => {
						return {
							bindings: state.bindings.filter(
								(b) => b.key !== bindingKey,
							),
						};
					}),
			}}
		>
			{props.children}
		</KeyboardBindings.Provider>
	);
};

export const useKeyboardBindingContext = () => useContext(KeyboardBindings);

export const useKeyboardBinding = (binding: Binding & { handler: Handler }) => {
	const keyboardContext = useContext(KeyboardBindings);

	useKey(bindingKeyToUseKeyParam(binding.key), (e) => {
		if (document.activeElement?.tagName.toLowerCase() == "input") {
			return;
		}
		binding.handler(e);
	});
	useEffect(() => {
		keyboardContext.addBinding(binding.key, binding.description);
		return () => {};
	}, [binding]);
	return {};
};
