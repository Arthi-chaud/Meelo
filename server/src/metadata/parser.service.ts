/* eslint-disable id-length */
import { Injectable } from "@nestjs/common";
import Metadata from "./models/metadata";
import escapeRegex from "src/utils/escape-regex";

@Injectable()
export default class ParserService {
	constructor() {}

	public static separators = [
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
		const topLevelGroups = ParserService.separators
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

	private stripGroupDelimiters(group: string): string {
		let strippedGroup = group;

		ParserService.separators
			.forEach(([startDelim, endDelim]) => {
				// We want to remove the end if the start was removed successfully
				const strippedStart = strippedGroup
					.replace(new RegExp(`^\\s*${startDelim.source}\\s*`), '');

				if (strippedStart != strippedGroup) {
					strippedGroup = strippedStart.replace(new RegExp(`\\s*${endDelim.source}\\s*$`), '');
				}
			});
		return strippedGroup;
	}

	/**
	 * @example 'My Album (a) [b] {c}'  => ['My Album', 'a', 'b', 'c']
	 * @example 'My Song (feat. A) - B Remix' -> ['My Song', 'feat. A', 'B Remix']
	 */
	splitGroups(tokenString: string): string[] {
		const tokens: string[] = [];
		let strippedToken = tokenString;
		const groups = this.getGroups(strippedToken);

		groups.forEach((group) => {
			const strippedGroup = this.stripGroupDelimiters(group);

			strippedToken = strippedToken.replace(new RegExp(`\\s*${escapeRegex(group)}`), '');
			// We call recursively to handle nested groups
			tokens.push(...this.splitGroups(strippedGroup));
		});

		return [strippedToken.trim(), ...tokens];
	}

	/**
	 * Extracts from the song name, and return the '(feat. ...)' segment
	 * @param songName the name of the song, as from the source file's metadata
	 * @example A (feat. B) => [A, [B]]
	 */
	extractFeaturedArtistsFromSongName(_songName: string): Pick<Metadata, 'name' | 'featuring'> {
		return '' as any;
	}

	/**
	 * @example "A & B" => [A, B]
	 * @param artistName the artist of the song, as from the source file's metadata
	 */
	extractFeaturedArtistsFromArtistName(_artistName: string): Pick<Metadata, 'artist' | 'featuring'> {
		return '' as any;
	}
}
