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

import slug from "slug";

/**
 * A Slug is a character string which identifies a resource
 * This allows resource identification
 */
export default class Slug {
	private readonly content: string;

	/**
	 * Separator of 'words' in a Slug
	 */
	static readonly separator = "-";

	/**
	 * @return true is the string is already a slug
	 */
	static isSlug(str: string): boolean {
		return str === new Slug(str).content;
	}

	constructor(...args: string[]) {
		this.content = this.buildSlug(...args);
	}

	/**
	 * Builds a slug string from an array of tokens
	 * @param args a list of token used to create the slug
	 * @returns a slug string
	 */
	private buildSlug(...args: string[]): string {
		args.forEach((arg, index) => {
			if (arg.length < 1) {
				throw new Error(
					`Argument ${index}: building a slug requires at non-empty argument`,
				);
			}
		});
		switch (args.length) {
			case 0:
				throw new Error(
					"Building a slug requires at least one argument",
				);
			case 1:
				return this.buildSingleSlug(args[0]);
			default:
				return this.buildSingleSlug(
					args
						.map((arg) => this.buildSingleSlug(arg))
						.join(Slug.separator),
				);
		}
	}

	private buildSingleSlug(arg: string): string {
		let formatted = slug(
			arg
				.replace(/‐/g, Slug.separator)
				.replace("...", " ")
				.replace("…", " "),
		);

		if (Number.isNaN(Number(formatted)) === false) {
			formatted += "!";
		}
		return formatted;
	}

	/**
	 * @returns The Slug as a string
	 */
	public toString(): string {
		return this.content;
	}
}
