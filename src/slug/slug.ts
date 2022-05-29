import slug from 'slug';
import { InvalidRequestException } from 'src/exceptions/meelo-exception';

/**
 * A Slug is a character string which identifies a resource
 * This allows resource identification
 */
export class Slug {
	private readonly content: string;
	/**
	 * @return true is the string is already a slug
	 */
	static isSlug(str: string): boolean {
		return str == new Slug(str).content;
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
			if (arg.length < 1)
				throw new Error(`Argument ${index}: building a slug requires at non-empty argument`);
		});
		switch (args.length) {
			case 0:
				throw new Error('Building a slug requires at least one argument');
			case 1:
				return slug(args[0]);
			default:
				return slug(args.map((arg) => slug(arg)).join('-'));
		}
	}

	/**
	 * @returns The Slug as a string
	 */
	public toString(): string {
		return this.content;
	}
}