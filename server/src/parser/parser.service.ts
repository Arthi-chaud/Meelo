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

import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { AlbumType, SongType, VideoType } from "src/prisma/generated/client";
import ArtistService from "src/artist/artist.service";
import Slug from "src/slug/slug";
import escapeRegex from "src/utils/escape-regex";
import type Metadata from "../registration/models/metadata";

@Injectable()
export default class ParserService {
	constructor(
		@Inject(forwardRef(() => ArtistService))
		private artistService: ArtistService,
	) {}

	protected separators = [
		[/\(/, /\)/],
		[/\[/, /\]/],
		[/\{/, /\}/],
		[/\s+-\s+/, /$/],
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

				i += (nestedGroup?.length ?? 1) + 1;
				continue;
			}
			if (istart == null && startMatch) {
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
			strippedToken = strippedToken
				.replace(new RegExp(`\\s*${escapeRegex(nextGroup)}`), "")
				.trim();
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
					.replace(new RegExp(startReg), "")
					.replace(new RegExp(endReg), "");

				return [strippedStart, strippedGroup.trim(), strippedEnd];
			}
		}
		return ["", group, ""];
	}

	/**
	 * @example 'My Album (a) [b] {c}'  => ['My Album', 'a', 'b', 'c']
	 * @example 'My Song (feat. A) - B Remix' -> ['My Song', 'feat. A', 'B Remix']
	 */
	splitGroups(
		tokenString: string,
		opt?: { keepDelimiters?: boolean; removeRoot?: boolean },
	): string[] {
		const tokens: string[] = [];
		const groups = this.getGroups(tokenString);

		for (const group of groups) {
			const offset = tokenString.indexOf(group);
			const root = tokenString.slice(0, offset).trim(); // Anything before the group
			const [gstart, strippedGroup, gend] =
				this.stripGroupDelimiters(group);
			const subGroups = this.splitGroups(strippedGroup, {
				keepDelimiters: true,
				removeRoot: false,
			});
			if (root.length && !opt?.removeRoot) {
				// A (B)
				tokens.push(root);
			}
			// for each nested dashed group
			// merge with previous one
			for (let i = 1; i < subGroups.length; i++) {
				if (subGroups[i].startsWith("- ")) {
					subGroups[i - 1] = [subGroups[i - 1], subGroups[i]].join(
						" ",
					);
					subGroups.splice(i, 1);
					i = i - 1;
				}
			}
			if (opt?.keepDelimiters) {
				const first = subGroups.at(0);

				tokens.push(gstart + first + gend, ...subGroups.slice(1));
			} else {
				tokens.push(
					...subGroups.map((g) => {
						if (g.startsWith("- ")) {
							g = ` ${g}`;
						}
						return this.stripGroupDelimiters(g)[1];
					}),
				);
			}
			tokenString = tokenString.slice(offset + group.length);
		}
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
	async extractFeaturedArtistsFromSongName(
		songName: string,
	): Promise<Required<Pick<Metadata, "name" | "featuring">>> {
		const groups = this.splitGroups(songName, { keepDelimiters: true });
		const groupsWithoutFeaturings: string[] = [];
		const featuringArtists: string[] = [];
		const getRewrappers = () => {
			switch (groupsWithoutFeaturings.length) {
				case 0:
				case 1:
					return ["(", ")"] as const;
				case 2:
					return ["[", "]"] as const;
				default:
					return ["{", "}"] as const;
			}
		};

		for (const group of groups) {
			const rewrapper = getRewrappers(); // The delimiters to rewrap the group with
			const [sstart, strippedGroup, ssend] =
				this.stripGroupDelimiters(group);
			let featureSubGroup = strippedGroup.match(
				/(^with|(feat(uring|\.)?))\s+(?<artists>.*)$/i,
			);
			let artistGroupIndex = 4;

			if (!sstart && !ssend) {
				// If there is no delimiters
				featureSubGroup = strippedGroup.match(
					/(feat(uring|\.)?)\s+(?<artists>.*)$/i,
				);
				artistGroupIndex = 3;
			}
			if (featureSubGroup == null) {
				if (!sstart && !ssend) {
					// If the group has no wrappers
					groupsWithoutFeaturings.push(group);
				} else {
					groupsWithoutFeaturings.push(
						rewrapper[0] + strippedGroup + rewrapper[1],
					);
				}
			} else {
				const artistsInSubGroup =
					await this.extractFeaturedArtistsFromArtistName(
						featureSubGroup.at(artistGroupIndex)!,
					);
				const strippedGroupWithoutSub = strippedGroup
					.replace(featureSubGroup[0], "")
					.trim();

				if (strippedGroupWithoutSub) {
					if (sstart && ssend) {
						groupsWithoutFeaturings.push(
							sstart + strippedGroupWithoutSub + ssend,
						);
					} else {
						groupsWithoutFeaturings.push(strippedGroupWithoutSub);
					}
				}
				featuringArtists.push(
					artistsInSubGroup.artist,
					...artistsInSubGroup.featuring,
				);
			}
		}
		return {
			name: groupsWithoutFeaturings.join(" "),
			featuring: featuringArtists,
		};
	}

	/**
	 * @example "A & B" => [A, B]
	 * @param artistName the artist of the song, as from the source file's metadata
	 */
	async extractFeaturedArtistsFromArtistName(
		artistName: string,
	): Promise<Required<Pick<Metadata, "artist" | "featuring">>> {
		try {
			const { name } = await this.artistService.get({
				slug: new Slug(artistName),
			});
			return { artist: name, featuring: [] };
		} catch {
			//
		}
		const [main, ...feats] = (
			await Promise.all(
				artistName.split(/\s*,\s*/).map(async (s) => {
					const splitted = s
						.split(/\s+&\s+/)
						.flatMap((t) => t.split(/\s+vs\.\s+/i))
						.flatMap((t) => t.split(/\s+vs\s+/i));

					if (splitted.length === 1) {
						return splitted;
					}
					const [mainA, ...feat] = splitted;
					const parsedFeat =
						await this.extractFeaturedArtistsFromArtistName(
							feat.join(" & "),
						);

					return [mainA, parsedFeat.artist, ...parsedFeat.featuring];
				}),
			)
		)
			.flat()
			.map((s) => s.trim());
		const { name, featuring } =
			await this.extractFeaturedArtistsFromSongName(main);

		return {
			artist: name,
			featuring: featuring.concat(feats),
		};
	}

	// Remove all groups from song name
	stripGroups(songName: string): string {
		const groups = this.splitGroups(songName, {
			removeRoot: true,
			keepDelimiters: true,
		});

		for (const group of groups) {
			songName = songName.replace(group, "").trim();
		}
		return songName.trim();
	}

	getSongType(songName: string): SongType {
		const songExtensions = this.splitGroups(songName, { removeRoot: true });
		const lowercaseSongName = songName.toLowerCase();
		const jointExtensionWords = songExtensions
			.map((ext) => ext.toLowerCase())
			.filter(
				(ext) =>
					!(ext.startsWith("feat ") || ext.startsWith("featuring ")),
			)
			.join(" ");
		const extensionWords = jointExtensionWords.split(" ").flat();

		const containsWord = (word: string) => extensionWords.includes(word);
		const titleContainsWord = (word: string) =>
			lowercaseSongName.includes(word);

		if (titleContainsWord("interview")) {
			return SongType.NonMusic;
		}
		if (titleContainsWord("advert")) {
			return SongType.NonMusic;
		}
		if (
			titleContainsWord("documentaire") ||
			titleContainsWord("documentary")
		) {
			return SongType.NonMusic;
		}
		if (titleContainsWord("photo gallery")) {
			return SongType.NonMusic;
		}
		if (
			titleContainsWord("photo shoot") ||
			titleContainsWord("photoshoot")
		) {
			return SongType.NonMusic;
		}
		if (
			titleContainsWord("behind the scene") ||
			titleContainsWord("behind-the-scene") ||
			titleContainsWord("behind the music video") ||
			titleContainsWord("behind the video")
		) {
			return SongType.NonMusic;
		}
		if (
			titleContainsWord("making of") ||
			titleContainsWord("making the video")
		) {
			return SongType.NonMusic;
		}
		if (titleContainsWord("epk")) {
			return SongType.NonMusic;
		}
		if (
			titleContainsWord("television special") ||
			titleContainsWord("mtv special")
		) {
			return SongType.NonMusic;
		}
		if (titleContainsWord("voice memo")) {
			return SongType.NonMusic;
		}
		const isMegamix = () =>
			titleContainsWord("megamix") ||
			titleContainsWord("mega-mix") ||
			titleContainsWord("mashup") ||
			titleContainsWord("mash-up") ||
			titleContainsWord("medley");
		if (songExtensions.length === 0) {
			if (isMegamix()) {
				return SongType.Medley;
			}
			return SongType.Original;
		}
		if (containsWord("live") || containsWord("performance")) {
			return SongType.Live;
		}
		if (isMegamix()) {
			return SongType.Medley;
		}
		if (containsWord("acoustic")) {
			return SongType.Acoustic;
		}
		if (
			containsWord("remix") ||
			containsWord("dub") ||
			containsWord("extended") ||
			containsWord("vocal")
		) {
			return SongType.Remix;
		}
		if (containsWord("demo")) {
			return SongType.Demo;
		}
		if (
			jointExtensionWords.includes("alternative mix") ||
			jointExtensionWords.includes("alternative version")
		) {
			return SongType.Demo;
		}
		if (containsWord("clean")) {
			return SongType.Clean;
		}
		if (jointExtensionWords.includes("rough mix")) {
			return SongType.Demo;
		}
		if (jointExtensionWords === "original mix") {
			return SongType.Original;
		}
		if (containsWord("mix") && containsWord("edit")) {
			return SongType.Remix;
		}
		if (containsWord("edit")) {
			return SongType.Edit;
		}
		if (jointExtensionWords.includes("instrumental mix")) {
			return SongType.Instrumental;
		}
		if (
			jointExtensionWords.includes("mix") ||
			jointExtensionWords.includes("-mix") ||
			jointExtensionWords.includes("-mix-")
		) {
			return SongType.Remix;
		}
		if (
			containsWord("instrumental") ||
			containsWord("instrumentale") ||
			containsWord("deepstrumental")
		) {
			return SongType.Instrumental;
		}
		if (containsWord("single") || containsWord("radio")) {
			return SongType.Edit;
		}
		if (extensionWords.at(-1) === "beats") {
			return SongType.Remix;
		}
		if (
			containsWord("acapella") ||
			containsWord("acappella") ||
			containsWord("accappella") ||
			containsWord("accapella") ||
			titleContainsWord("a cappella")
		) {
			return SongType.Acappella;
		}
		if (
			containsWord('12"') ||
			containsWord("12''") ||
			containsWord('7"') ||
			containsWord("7''")
		) {
			return SongType.Remix;
		}
		if (containsWord("re-edit") || containsWord("re-mix")) {
			return SongType.Remix;
		}
		if (
			jointExtensionWords.includes("album version") ||
			jointExtensionWords.includes("main version") ||
			jointExtensionWords.includes("original version")
		) {
			return SongType.Original;
		}
		if (containsWord("version")) {
			return SongType.Remix;
		}
		return SongType.Original;
	}

	getAlbumType(albumName: string): AlbumType {
		albumName = albumName.toLowerCase();
		const containsWord = (s: string) => albumName.split(" ").includes(s);
		if (
			albumName.includes("soundtrack") ||
			albumName.includes("original score") ||
			albumName.includes("from the motion picture") ||
			albumName.includes("bande originale") ||
			albumName.includes(
				"music from and inspired by the television series",
			) ||
			albumName.includes("music from and inspired by the motion picture")
		) {
			return AlbumType.Soundtrack;
		}
		if (
			albumName.includes("music videos") ||
			albumName.includes("the video") ||
			albumName.includes("dvd") ||
			albumName.includes("videos")
		) {
			return AlbumType.VideoAlbum;
		}
		if (
			containsWord("live") ||
			albumName.search(/\W(live)\W/g) !== -1 ||
			albumName.includes("unplugged") ||
			albumName.includes(" tour") ||
			albumName.includes("live from ") ||
			albumName.includes("live at ") ||
			albumName.includes("live à ")
		) {
			return AlbumType.LiveRecording;
		}

		if (albumName.endsWith("- ep")) {
			return AlbumType.EP;
		}
		if (albumName.endsWith("- single") || albumName.endsWith("(remixes)")) {
			return AlbumType.Single;
		}
		if (
			albumName.includes("remix album") ||
			albumName.includes(" the remixes") ||
			albumName.includes("mixes") ||
			albumName.includes("remixes") ||
			albumName.includes("remixed") ||
			albumName.includes("best mixes")
		) {
			return AlbumType.RemixAlbum;
		}
		if (
			albumName.includes("best of") ||
			albumName.includes("hits") ||
			albumName.includes("greatest hits") ||
			albumName.includes("singles") ||
			albumName.includes("collection")
		) {
			return AlbumType.Compilation;
		}
		return AlbumType.StudioRecording;
	}

	getVideoType(videoName: string): VideoType {
		const songExtensions = this.splitGroups(videoName, {
			removeRoot: true,
		});
		const lowercaseSongName = videoName.toLowerCase();
		const jointExtensionWords = songExtensions
			.map((ext) => ext.toLowerCase())
			.filter(
				(ext) =>
					!(ext.startsWith("feat ") || ext.startsWith("featuring ")),
			)
			.join(" ");
		const extensionWords = jointExtensionWords.split(" ").flat();

		const containsWord = (word: string) =>
			extensionWords.includes(word) || lowercaseSongName.includes(word);
		const containsExtension = (word: string) =>
			extensionWords.includes(word);

		if (containsExtension("lyrics") || containsExtension("lyric")) {
			return VideoType.LyricsVideo;
		}
		if (containsWord("epk")) {
			return VideoType.Interview;
		}
		if (containsWord("interview")) {
			return VideoType.Interview;
		}
		if (containsWord("advert") || containsWord("teaser")) {
			return VideoType.Advert;
		}
		if (containsWord("documentaire") || containsWord("documentary")) {
			return VideoType.Documentary;
		}
		if (containsWord("photo gallery")) {
			return VideoType.PhotoGallery;
		}
		if (containsWord("photo shoot") || containsWord("photoshoot")) {
			return VideoType.BehindTheScenes;
		}
		if (
			containsWord("behind the scene") ||
			containsWord("behind-the-scene") ||
			containsWord("behind the music video") ||
			containsWord("behind the video")
		) {
			return VideoType.BehindTheScenes;
		}
		if (containsWord("b roll") || containsWord("b-roll")) {
			return VideoType.BehindTheScenes;
		}
		if (containsWord("making of") || containsWord("making the video")) {
			return VideoType.BehindTheScenes;
		}
		if (containsWord("television special") || containsWord("mtv special")) {
			return VideoType.Interview;
		}
		if (containsExtension("live") || containsExtension("performance")) {
			return VideoType.Live;
		}
		return VideoType.MusicVideo;
	}

	/**
	 * Removes an extension from a release's name
	 * For example, if the release Name is 'My Album (Deluxe Edition)', the parent
	 * album name would be 'My Album'
	 */
	parseReleaseExtension(releaseName: string) {
		const extensionKeywords = [
			"Reissue",
			"Deluxe",
			"Standard",
			"Edited",
			"Explicit",
			"Remastered",
			"Remaster",
			"Edition",
			"Version",
			"Vinyl",
			"Pressing",
		] as const;
		const { parsedName } = this.parseExtensions(
			releaseName,
			extensionKeywords,
		);
		const extensions = this.splitGroups(releaseName, {
			keepDelimiters: false,
			removeRoot: true,
		}).filter((group) =>
			extensionKeywords.find((keyword) =>
				group.toLocaleLowerCase().includes(keyword.toLocaleLowerCase()),
			),
		);
		return { parsedName, extensions };
	}

	// The following are unchanged
	// A (Lyric Video)
	// A (Bedroom Video)
	// A (Alternative Music Video)
	//
	// A (Video) becomes A
	// A (Music Video) becomes A
	removeVideoExtensions(videoName: string) {
		const groups = this.splitGroups(videoName, { keepDelimiters: true });
		const res: string[] = [];
		for (const group of groups) {
			const groupSlug = new Slug(group).toString();
			if (
				[
					"music-video",
					"video",
					"official video",
					"official music video",
				].includes(groupSlug)
			) {
				continue;
			}
			res.push(group);
		}
		return res.join(" ");
	}

	/**
	 * Removes an extension from a track's name
	 * For example, if the release Name is 'My Song (Music Video)', the parent
	 * song name would be 'My Song'
	 * It will remove the video and the remaster extension
	 */
	parseTrackExtensions(trackName: string) {
		const { parsedName, ...ext } = this.parseExtensions(
			trackName,
			[
				"Bonus Track",
				"Video",
				"Remastered",
				"Remaster",
				"Album Version",
				"Album Mix",
				"Main Version",
				"Mixed",
				"Mixed Version",
			] as const,
			[
				"Live",
				"Extended",
				"Instrumental",
				"Edit",
				"Video Mix",
				"Video Remix",
			],
		);
		return {
			parsedName,
			remastered: ext.Remaster || ext.Remastered,
			bonus: ext["Bonus Track"],
			// biome-ignore lint/complexity/useLiteralKeys: Clarity
			mixed: ext["Mixed"],
			main:
				ext["Album Version"] || ext["Main Version"] || ext["Album Mix"],
			video: ext.Video,
		};
	}

	private parseExtensions<Keyword extends string>(
		source: string,
		extension: readonly Keyword[],
		ignore: string[] = [],
	) {
		return extension.reduce(
			(reduced, currentKeyword) => {
				const stripped = this.removeExtensions(
					reduced.parsedName,
					[currentKeyword],
					ignore,
				);

				return {
					...reduced,
					parsedName: stripped,
					[currentKeyword]: stripped !== reduced.parsedName,
				} as const;
			},
			{ parsedName: source } as { parsedName: string } & Record<
				Keyword,
				boolean
			>,
		);
	}

	/**
	 * Removes the extensions in a string found by 'extractExtensions'
	 * @param source the string to find the extensions in
	 * @param extensions the extensions to find
	 * @returns the cleaned source
	 */
	private removeExtensions(
		source: string,
		extensions: string[],
		ignore: string[],
	): string {
		const extensionsGroup = extensions.map((ext) => `(${ext})`).join("|");
		const ignoreGroup = ignore.map((ext) => `(${ext})`).join("|");

		return this.splitGroups(source, { keepDelimiters: true })
			.filter((group) => {
				// If root
				if (group === this.stripGroupDelimiters(group)[1]) {
					return true;
				}
				if (
					ignore.length &&
					new RegExp(`.*(${ignoreGroup}).*`, "i")
						.exec(group)
						?.at(0) !== undefined
				) {
					return true;
				}
				return (
					new RegExp(`.*(${extensionsGroup}).*`, "i")
						.exec(group)
						?.at(0) === undefined
				);
			})
			.map((group) => group.trim())
			.join(" ")
			.trim();
	}
}
