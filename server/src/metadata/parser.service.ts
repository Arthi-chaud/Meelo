/* eslint-disable id-length */
import { Injectable } from "@nestjs/common";
import escapeRegex from "src/utils/escape-regex";

@Injectable()
export default class ParserService {
	constructor() {}

	protected separators = [
		[/\(/, /\)/],
		[/\[/, /\]/],
		[/\{/, /\}/],
		[/\s+-\s+/, /$/]
	] as const;

	private _getFirstGroup(token: string, start: RegExp, end: RegExp) {
		const l = token.length;
		let istart: number | null = null;
		let i = 0;

		// Use `<=` to have an empty string when we get at end of string, needed for dashed groups
		while (i <= l) {
			const slice = token.slice(i);
			const startMatch = slice.match(`^${start.source}.+`);
			const endMatch = slice.match(`^${end.source}`);

			if (istart !== null && startMatch) {
				const nestedGroup = this._getFirstGroup(slice, start, end);

				i += ((nestedGroup?.length) ?? 1) + 1;
				continue;
			} else if (istart == null && startMatch) {
				istart = i;
			} else if (endMatch && istart !== null) {
				return token.slice(istart, i + 1);
			}
			i++;
		}
		return null;
	}

	/**
	 * Returns the first group in the string, with its delimiters
	 */
	private getFirstGroup(tokenString: string): string | null {
		const topLevelGroups = this.separators
			.map(([start, end]) => this._getFirstGroup(tokenString, start, end))
			.filter((group): group is string => group !== null)
			.map((group) => [group, tokenString.indexOf(group)] as const)
			.sort(([_, ia], [__, ib]) => ia - ib); // The lowest the score, the closer to the beginning
		const firstGroup = topLevelGroups.at(0);

		if (firstGroup) {
			return firstGroup[0];
		}
		return null;
	}

	private getGroups(tokenString: string): string[] {
		const tokens: string[] = [];
		let strippedToken = tokenString;
		let nextGroup = this.getFirstGroup(strippedToken);

		while (nextGroup) {
			tokens.push(nextGroup);
			strippedToken = strippedToken.replace(new RegExp(`\\s*${escapeRegex(nextGroup)}`), '').trim();
			nextGroup = this.getFirstGroup(strippedToken);
		}
		return tokens;
	}

	public stripGroupDelimiters(group: string): [string, string, string] {
		for (const [startDelim, endDelim] of this.separators) {
			const startReg = `^\\s*${startDelim.source}\\s*`;
			const endReg = `\\s*${endDelim.source}\\s*$`;
			const strippedStart = group.match(startReg)?.at(0)?.trimStart();
			const strippedEnd = group.match(endReg)?.at(0)?.trim();

			if (strippedStart !== undefined && strippedEnd !== undefined) {
				const strippedGroup = group
					.replace(new RegExp(startReg), '')
					.replace(new RegExp(endReg), '');

				return [strippedStart, strippedGroup.trim(), strippedEnd];
			}
		}
		return ['', group, ''];
	}

	/**
	 * @example 'My Album (a) [b] {c}'  => ['My Album', 'a', 'b', 'c']
	 * @example 'My Song (feat. A) - B Remix' -> ['My Song', 'feat. A', 'B Remix']
	 */
	splitGroups(tokenString: string, opt?: { keepDelimiters: boolean }): string[] {
		const tokens: string[] = [];
		const groups = this.getGroups(tokenString);

		groups.forEach((group) => {
			const offset = tokenString.indexOf(group);
			const root = tokenString.slice(0, offset).trim(); // Anything before the group
			const [gstart, strippedGroup, gend] = this.stripGroupDelimiters(group);
			// We call recursively to handle nested groups
			const subGroups = this.splitGroups(strippedGroup, opt);

			if (root.length) { // A (B)
				tokens.push(root);
			}
			if (opt?.keepDelimiters) {
				// We do this because dashed groups will have trailing groups in `strippedGroup`
				const first = gend == '' ? subGroups.at(0) : strippedGroup;

				tokens.push(gstart + first + gend, ...subGroups.slice(1));
			} else {
				tokens.push(...subGroups);
			}
			tokenString = tokenString.slice(offset + group.length);
		});
		tokenString = tokenString.trim();
		if (tokenString.length) {
			tokens.push(tokenString);
		}
		return tokens;
	}
}
