/* eslint-disable id-length */
import {
	Inject, Injectable, forwardRef
} from "@nestjs/common";
import Metadata from "./models/metadata";
import { AlbumType, SongType } from "@prisma/client";
import escapeRegex from "src/utils/escape-regex";
import ArtistService from "src/artist/artist.service";
import Slug from "src/slug/slug";

@Injectable()
export default class ParserService {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService
	) {}

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
	splitGroups(
		tokenString: string,
		opt?: { keepDelimiters?: boolean, removeRoot?: boolean }
	): string[] {
		const tokens: string[] = [];
		const groups = this.getGroups(tokenString);

		groups.forEach((group) => {
			const offset = tokenString.indexOf(group);
			const root = tokenString.slice(0, offset).trim(); // Anything before the group
			const [gstart, strippedGroup, gend] = this.stripGroupDelimiters(group);
			// We call recursively to handle nested groups
			const subGroups = this.splitGroups(
				strippedGroup, { keepDelimiters: opt?.keepDelimiters }
			);

			if (root.length && !opt?.removeRoot) { // A (B)
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
		if (tokenString.length && !opt?.removeRoot) {
			tokens.push(tokenString);
		}
		return tokens;
	}

	/**
	 * Extracts from the song name, and return the '(feat. ...)' segment
	 * @param songName the name of the song, as from the source file's metadata
	 * @example A (feat. B) => [A, [B]]
	 */
	async extractFeaturedArtistsFromSongName(songName: string): Promise<Pick<Metadata, 'name' | 'featuring'>> {
		const groups = this.splitGroups(songName, { keepDelimiters: true });
		const groupsWithoutFeaturings: string[] = [];
		const featuringArtists: string[] = [];
		const getRewrappers = () => {
			switch (groupsWithoutFeaturings.length) {
			case 0:
			case 1:
				return ['(', ')'] as const;
			case 2:
				return ['[', ']'] as const;
			default:
				return ['{', '}'] as const;
			}
		};

		for (const group of groups) {
			const rewrapper = getRewrappers(); // The delimiters to rewrap the group with
			const [sstart, strippedGroup, ssend] = this.stripGroupDelimiters(group);
			let featureSubGroup = strippedGroup.match(
				/(feat(uring|\.)?|with)\s+(?<artists>.*)$/i
			);

			if (!sstart && !ssend) { // If there is no delimiters
				featureSubGroup = strippedGroup.match(
					/(feat(uring|\.)?)\s+(?<artists>.*)$/i
				);
			}
			if (featureSubGroup == null) {
				if (!sstart && !ssend) { // If the group has no wrappers
					groupsWithoutFeaturings.push(group);
				} else {
					groupsWithoutFeaturings.push(rewrapper[0] + strippedGroup + rewrapper[1]);
				}
			} else {
				const artistsInSubGroup = await this.extractFeaturedArtistsFromArtistName(
					featureSubGroup.at(3)!
				);
				const strippedGroupWithoutSub = strippedGroup.replace(featureSubGroup[0], '').trim();

				if (strippedGroupWithoutSub) {
					groupsWithoutFeaturings.push(strippedGroupWithoutSub);
				}
				featuringArtists.push(artistsInSubGroup.artist, ...artistsInSubGroup.featuring);
			}
		}
		return {
			name: groupsWithoutFeaturings.join(' '),
			featuring: featuringArtists
		};
	}

	/**
	 * @example "A & B" => [A, B]
	 * @param artistName the artist of the song, as from the source file's metadata
	 */
	async extractFeaturedArtistsFromArtistName(artistName: string): Promise<Pick<Metadata, 'artist' | 'featuring'>> {
		if (await this.artistService.exists({ slug: new Slug(artistName) })) {
			return { artist: artistName, featuring: [] };
		}
		const [main, ...feats] = (await Promise.all(artistName
			.split(/\s*,\s*/)
			.map(async (s) => {
				const splitted = s.split(/\s+&\s+/);

				if (splitted.length == 1) {
					return splitted;
				}
				const [mainA, ...feat] = splitted;
				const parsedFeat = await this.extractFeaturedArtistsFromArtistName(feat.join(' & '));

				return [mainA, parsedFeat.artist, ...parsedFeat.featuring];
			})))
			.flat()
			.map((s) => s.trim());
		const { name, featuring } = await this.extractFeaturedArtistsFromSongName(main);

		return {
			artist: name,
			featuring: featuring.concat(feats)
		};
	}

	// Remove all groups from song name
	stripGroups(songName: string): string {
		const groups = this.splitGroups(songName, { removeRoot: true, keepDelimiters: true });

		groups.forEach((group) => {
			songName = songName.replace(group, '').trim();
		});
		return songName.trim();
	}

	getSongType(songName: string): SongType {
		const songExtensions = this.splitGroups(songName, { removeRoot: true });
		const extensionWords = songExtensions
			.map((ext) => ext.toLowerCase())
			.filter((ext) => !(ext.startsWith('feat ') || ext.startsWith('featuring ')))
			.map((ext) => ext.split(' ')).flat();

		const containsWord = (word: string) => extensionWords.includes(word);

		if (songExtensions.length == 0) {
			return SongType.Original;
		}
		if (containsWord('live')) {
			return SongType.Live;
		}
		if (containsWord('acoustic')) {
			return SongType.Acoustic;
		}
		if (containsWord('remix') || containsWord('dub') || containsWord('extended') || containsWord('vocal')) {
			return SongType.Remix;
		}
		if (containsWord('demo')) {
			return SongType.Demo;
		}
		if (containsWord('clean')) {
			return SongType.Clean;
		}
		if (extensionWords.join(' ').includes('rough mix')) {
			return SongType.Original;
		}
		if (containsWord('mix') && containsWord('edit')) {
			return SongType.Remix;
		}
		if (containsWord('edit')) {
			return SongType.Edit;
		}
		if (extensionWords.join(' ').includes('instrumental mix')) {
			return SongType.Instrumental;
		}
		if (containsWord('mix')) {
			return SongType.Remix;
		}
		if (containsWord('instrumental') || containsWord('instrumentale')) {
			return SongType.Instrumental;
		}
		if (containsWord('single')) {
			return SongType.Edit;
		}
		if (extensionWords.at(-1) == 'beats') {
			return SongType.Remix;
		}
		if (containsWord('acapella')) {
			return SongType.Acapella;
		}
		return SongType.Original;
	}

	getAlbumType(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		if (albumName.includes('soundtrack') ||
			albumName.includes('from the motion picture') ||
			albumName.includes('bande originale') ||
			albumName.includes('music from and inspired by the television series') ||
			albumName.includes('music from and inspired by the motion picture')) {
			return AlbumType.Soundtrack;
		}
		if (albumName.includes('music videos') ||
			albumName.includes('the video') ||
			albumName.includes('dvd')) {
			return AlbumType.VideoAlbum;
		}
		if (albumName.search(/.+(live).*/g) != -1 ||
			albumName.includes('unplugged') ||
			albumName.includes(' tour') ||
			albumName.includes('live from ') ||
			albumName.includes('live at ') ||
			albumName.includes('live à ')) {
			return AlbumType.LiveRecording;
		}
		if (albumName.endsWith('- single') ||
			albumName.endsWith('- ep') ||
			albumName.endsWith('(remixes)')) {
			return AlbumType.Single;
		}
		if (
			albumName.includes('remix album') ||
			albumName.includes(' the remixes') ||
			albumName.includes('mixes') ||
			albumName.includes('remixes') ||
			albumName.includes('remixed') ||
			albumName.includes('best mixes')) {
			return AlbumType.RemixAlbum;
		}
		if (albumName.includes('best of') ||
			albumName.includes('hits') ||
			albumName.includes('greatest hits') ||
			albumName.includes('singles') ||
			albumName.includes('collection')) {
			return AlbumType.Compilation;
		}
		return AlbumType.StudioRecording;
	}
}
