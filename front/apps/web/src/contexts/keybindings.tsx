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

import { useRouter } from "next/router";
import {
	createContext,
	type DependencyList,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { useKey as _useKey } from "react-use";
import type { Handler } from "react-use/lib/useKey";

type BindingKey = "esc" | "?" | "/" | "s" | "p" | "space";

const bindingKeyToUseKeyParam = (bindingKey: BindingKey): string => {
	switch (bindingKey) {
		case "esc":
			return "Escape";
		case "space":
			return " ";
		default:
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

const useKey = (...p: Parameters<typeof _useKey>) => {
	return _useKey(
		p[0],
		(e) => {
			const tagName = document.activeElement?.tagName.toLowerCase();
			if (tagName === "input" || tagName === "textarea") {
				return;
			}
			// Prevent default for the "/" key to stop Firefox's quick find
			if (p[0] === "/") {
				e.preventDefault();
			}
			p[1]?.(e);
		},
		p[2],
		p[3],
	);
};

export const KeyboardBindingsProvider = (props: { children: ReactNode[] }) => {
	const router = useRouter();
	const [{ bindings }, setBindings] = useState<BindingsState>({
		bindings: [
			{ key: "/", description: "keyboardBindings.goToSearchPage" },
			{ key: "s", description: "keyboardBindings.goToSettingsPage" },
		],
	});
	useKey(bindingKeyToUseKeyParam("/"), () => router.push("/search"));
	useKey(bindingKeyToUseKeyParam("s"), () => router.push("/settings"));

	return (
		<KeyboardBindings.Provider
			value={{
				bindings,
				addBinding: (newBindingKey, description) => {
					setBindings((state) => {
						const bindingsCopy = Array.of(...state.bindings);
						const oldBinding = bindingsCopy.find(
							(b) => b.key === newBindingKey,
						);
						if (!oldBinding) {
							bindingsCopy.push({
								key: newBindingKey,
								description: description,
							});
							return { bindings: bindingsCopy };
						}
						if (oldBinding.description === description) {
							return state;
						}

						// biome-ignore lint/suspicious/noConsole: OK
						console.error(
							"Keyboard binding is probably getting duplicated.",
							{
								newBindingKey,
								description,
							},
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

export const useKeyboardBinding = (
	binding: Binding & { handler: Handler },
	deps: DependencyList = [],
) => {
	const keyboardContext = useContext(KeyboardBindings);

	useKey(
		bindingKeyToUseKeyParam(binding.key),
		(e) => binding.handler(e),
		{},
		[...deps],
	);
	useEffect(() => {
		keyboardContext.addBinding(binding.key, binding.description);
		return () => {
			keyboardContext.removeBinding(binding.key);
		};
	}, []);
	return {};
};
