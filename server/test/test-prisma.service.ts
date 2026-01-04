import { Injectable } from "@nestjs/common";
import { hashSync } from "bcrypt";
import Logger from "src/logger/logger";
import {
	type Album,
	AlbumType,
	type Artist,
	type File,
	type Genre,
	type Label,
	type Library,
	type Lyrics,
	type PlaylistEntry,
	type Release,
	type Song,
	SongType,
	type Track,
	TrackType,
	type User,
	type Video,
	VideoType,
} from "src/prisma/generated/client";
import type { Playlist } from "src/prisma/models";
import PrismaService from "src/prisma/prisma.service";
import Slug from "src/slug/slug";

@Injectable()
export default class TestPrismaService extends PrismaService {
	public library1: Library;
	public library2: Library;

	public genreA: Genre;
	public genreB: Genre;
	public genreC: Genre;

	public artistA: Artist;
	public artistB: Artist;
	public artistC: Artist;
	public songA1: Song;
	public songA2: Song;
	public songB1: Song;
	public songC1: Song;
	public albumA1: Album;
	public albumB1: Album;
	public releaseA1_1: Release;
	public releaseA1_2: Release;
	public releaseB1_1: Release;
	public trackA1_1: Track;
	public trackA1_2Video: Track;
	public trackA2_1: Track;
	public trackB1_1: Track;
	public trackC1_1: Track;
	public fileA1_1: File;
	public fileA1_2Video: File;
	public fileA2_1: File;
	public fileB1_1: File;
	public fileC1_1: File;
	public lyricsA1: Lyrics;
	public playlist1: Playlist;
	public playlist2: Playlist;
	public playlist3: Playlist;

	public playlistEntry1: PlaylistEntry;
	public playlistEntry2: PlaylistEntry;
	public playlistEntry3: PlaylistEntry;

	public labelA: Label;
	public labelB: Label;

	public compilationAlbumA: Album;
	public compilationReleaseA1: Release;

	public user1: User;
	public user2: User;

	public videoA1: Video;

	private baseTrack = {
		bitrate: 0,
		ripSource: null,
		duration: 0,
	};

	private readonly logger = new Logger(PrismaService.name);

	protected async flushDatabase() {
		this.logger.warn("Flushing database");
		const tablenames = await this.$queryRaw<
			Array<{ tablename: string }>
		>`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

		await this.$transaction(
			tablenames
				.map(({ tablename }) => tablename)
				.filter((tname) => tname !== "_prisma_migrations")
				.map((tablename) =>
					this.$executeRawUnsafe(
						`TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
					),
				),
		);
	}

	/**
	 * Creates dummy data and pushes it to the database using the repository service.
	 * It will also clear previous data
	 */
	override async onModuleInit() {
		await this.$connect();
		await this.flushDatabase();

		[this.labelA, this.labelB] = await this.label.createManyAndReturn({
			data: [
				{ name: "Warner Bros.", slug: "warner-bros" },
				{ name: "Mushroom Records", slug: "mushroom-records" },
			],
		});
		[this.user1, this.user2] = await this.user.createManyAndReturn({
			data: [
				{
					name: "user",
					password: hashSync("1234", 4),
					admin: true,
					enabled: true,
				},
				{ name: "user2", password: hashSync("1234", 4) },
			],
		});
		[this.library1, this.library2] = await this.library.createManyAndReturn(
			{
				data: [
					{ name: "Library", path: "Music", slug: "library" },
					{ name: "Library 2", path: "Music 2", slug: "library-2" },
				],
			},
		);

		[this.genreA, this.genreB, this.genreC] =
			await this.genre.createManyAndReturn({
				data: [
					{ name: "My Genre A", slug: "my-genre-a" },
					{ name: "My Genre B", slug: "my-genre-b" },
					{ name: "My Genre C", slug: "my-genre-c" },
				],
			});
		[this.artistA, this.artistB, this.artistC] =
			await this.artist.createManyAndReturn({
				data: [
					{
						name: "My Artist",
						slug: "my-artist",
						sortName: "My Artist",
						sortSlug: "my-artist",
					},

					{
						name: "My Second Artist",
						slug: "my-second-artist",
						sortName: "My Second Artist",
						sortSlug: "my-second-artist",
					},

					{
						name: "My Third Artist",
						slug: "my-third-artist",
						sortName: "My Third Artist",
						sortSlug: "my-third-artist",
					},
				],
			});
		[this.albumA1, this.albumB1, this.compilationAlbumA] =
			await this.album.createManyAndReturn({
				data: [
					{
						name: "My Album",
						slug: "my-artist-my-album",
						sortName: "My Album",
						sortSlug: "my-album",
						nameSlug: "my-album",
						artistId: this.artistA.id,
						releaseDate: new Date("2022"),
					},
					{
						name: "My Second Album",
						slug: "my-second-artist-my-second-album",
						nameSlug: "my-second-album",
						sortName: "My Second Album",
						sortSlug: "my-second-album",
						artistId: this.artistB.id,
					},
					{
						name: "My Compilation Album",
						slug: "compilations-my-compilation-album",
						nameSlug: "my-compilation-album",
						sortName: "My Compilation Album",
						sortSlug: "my-compilation-album",
						releaseDate: new Date("2000"),
						type: AlbumType.Compilation,
					},
				],
			});
		[
			this.releaseA1_1,
			this.releaseA1_2,
			this.releaseB1_1,
			this.compilationReleaseA1,
		] = await this.release.createManyAndReturn({
			data: [
				{
					name: "My Album 1",
					slug: "my-artist-my-album-1",
					nameSlug: "my-album-1",
					albumId: this.albumA1.id,
					labelId: this.labelA.id,
					releaseDate: new Date("2022"),
				},
				{
					name: "My Album 2",
					slug: "my-artist-my-album-2",
					nameSlug: "my-album-2",
					labelId: this.labelB.id,
					albumId: this.albumA1.id,
				},
				{
					name: "My Second Album 1",
					slug: "my-second-artist-my-second-album-1",
					nameSlug: "my-second-album-1",
					labelId: this.labelA.id,
					albumId: this.albumB1.id,
				},
				{
					name: "My Compilation Album 1",
					slug: "compilations-my-compilation-album-1",
					nameSlug: "my-compilation-album-1",
					albumId: this.compilationAlbumA.id,
					releaseDate: new Date("2000"),
				},
			],
		});
		const [songGroupA1, songGroupA2, songGroupB, songGroupC] =
			await this.songGroup.createManyAndReturn({
				data: [
					{ slug: new Slug(this.artistA.name, "my-song").toString() },

					{
						slug: new Slug(
							this.artistA.name,
							"my-other-song",
						).toString(),
					},
					{
						slug: new Slug(
							this.artistB.name,
							"my-second-song",
						).toString(),
					},
					{
						slug: new Slug(
							this.artistC.name,
							"my-c-song",
						).toString(),
					},
				],
			});
		[this.songA1, this.songA2, this.songB1, this.songC1] =
			await this.song.createManyAndReturn({
				data: [
					{
						name: "My Song",
						slug: "my-artist-my-song",
						nameSlug: "my-song",
						sortName: "My Song",
						sortSlug: "my-song",
						artistId: this.artistA.id,
						type: SongType.Original,
						groupId: songGroupA1.id,
					},
					{
						name: "My Other Song",
						slug: "my-artist-my-other-song",
						nameSlug: "my-other-song",
						sortName: "My Other Song",
						sortSlug: "my-other-song",
						artistId: this.artistA.id,
						groupId: songGroupA2.id,
						type: SongType.Original,
					},
					{
						name: "My Second Song",
						slug: "my-second-artist-my-second-song",
						sortName: "My Second Song",
						sortSlug: "my-second-song",
						nameSlug: "my-second-song",
						artistId: this.artistB.id,
						groupId: songGroupB.id,
						type: SongType.Original,
					},
					{
						name: "My C Song",
						slug: "my-third-artist-my-c-song",
						sortName: "My C Song",
						sortSlug: "my-c-song",
						nameSlug: "my-c-song",
						artistId: this.artistC.id,
						groupId: songGroupC.id,
						type: SongType.Original,
					},
				],
			});
		await this.$transaction([
			this.song.update({
				data: {
					genres: {
						connect: [
							{ id: this.genreA.id },
							{ id: this.genreB.id },
						],
					},
				},
				where: { id: this.songA1.id },
			}),
			this.song.update({
				data: {
					genres: {
						connect: [{ id: this.genreB.id }],
					},
				},
				where: { id: this.songA2.id },
			}),
			this.song.update({
				data: {
					genres: {
						connect: [{ id: this.genreB.id }],
					},
				},
				where: { id: this.songB1.id },
			}),
			this.song.update({
				data: {
					genres: {
						connect: [{ id: this.genreC.id }],
					},
				},
				where: { id: this.songC1.id },
			}),
		]);
		[this.lyricsA1] = await this.lyrics.createManyAndReturn({
			data: [
				{
					songId: this.songA1.id,
					plain: "1234",
				},
			],
		});
		[
			this.fileA1_1,
			this.fileA1_2Video,
			this.fileA2_1,
			this.fileB1_1,
			this.fileC1_1,
		] = await this.file.createManyAndReturn({
			data: [
				{
					path: "Artist A/Album A/1-02 My Song.m4a",
					checksum: "",
					registerDate: new Date(),
					libraryId: this.library1.id,
					fingerprint: "ACOUSTID",
				},
				{
					path: "Artist A/Album A/My Song.m4v",
					checksum: "",
					registerDate: new Date(),
					libraryId: this.library1.id,
				},
				{
					path: "Artist A/Album B/My Other Song.m4a",
					checksum: "",
					registerDate: new Date(),
					libraryId: this.library2.id,
				},
				{
					path: "Artist B/Album B/My Second Song.m4a",
					checksum: "",
					registerDate: new Date(),
					libraryId: this.library2.id,
				},
				{
					path: "Compilations/Album C/My C Song.m4a",
					checksum: "",
					registerDate: new Date(),
					libraryId: this.library1.id,
				},
			],
		});
		this.videoA1 = await this.video.create({
			data: {
				name: "My Song",
				slug: "my-artist-my-song",
				sortSlug: "my-song",
				sortName: "My Song",
				artist: { connect: { id: this.artistA.id } },
				song: { connect: { id: this.songA1.id } },
				type: VideoType.MusicVideo,
				group: {
					connect: {
						slug: new Slug(this.artistA.name, "my-song").toString(),
					},
				},
			},
		});

		[
			this.trackA1_1,
			this.trackA1_2Video,
			this.trackA2_1,
			this.trackB1_1,
			this.trackC1_1,
		] = await this.track.createManyAndReturn({
			data: [
				{
					name: "My Song 1",
					...this.baseTrack,
					songId: this.songA1.id,
					releaseId: this.releaseA1_1.id,
					type: TrackType.Audio,
					sourceFileId: this.fileA1_1.id,
					trackIndex: 2,
					discIndex: 1,
				},
				{
					...this.baseTrack,
					name: "My Song 2 (Video)",
					songId: this.songA1.id,
					discIndex: 2,
					videoId: this.videoA1.id,
					releaseId: this.releaseA1_2.id,
					type: TrackType.Video,
					sourceFileId: this.fileA1_2Video.id,
				},
				{
					...this.baseTrack,
					name: "My Other Song 1",
					songId: this.songA2.id,
					discIndex: 1,
					releaseId: this.releaseA1_2.id,
					type: TrackType.Audio,
					sourceFileId: this.fileA2_1.id,
				},
				{
					...this.baseTrack,
					name: "My Second Song 1",
					songId: this.songB1.id,
					releaseId: this.releaseB1_1.id,
					type: TrackType.Audio,
					sourceFileId: this.fileB1_1.id,
				},
				{
					...this.baseTrack,
					name: "My C Song 1",
					songId: this.songC1.id,
					discIndex: 3,
					releaseId: this.compilationReleaseA1.id,
					type: TrackType.Audio,
					sourceFileId: this.fileC1_1.id,
				},
			],
		});
		this.videoA1 = await this.video.update({
			data: { masterId: this.trackA1_2Video.id },
			where: { id: this.videoA1.id },
		});

		[this.playlist1, this.playlist2, this.playlist3] =
			await this.playlist.createManyAndReturn({
				data: [
					{
						name: "My Playlist 1",
						slug: `my-playlist-1-${this.user1.id}`,
						createdAt: new Date("2000-01-01"),
						isPublic: true,
						allowChanges: true,
						ownerId: this.user1.id,
					},
					{
						name: "The Playlist 2",
						slug: `the-playlist-2-${this.user1.id}`,
						createdAt: new Date("2000-01-02"),
						isPublic: true,
						allowChanges: false,
						ownerId: this.user1.id,
					},
					{
						name: "Playlist 3",
						slug: `playlist-3-${this.user1.id}`,
						createdAt: new Date("2000-01-03"),
						isPublic: false,
						allowChanges: false,
						ownerId: this.user1.id,
					},
				],
			});
		[this.playlistEntry2, this.playlistEntry1, this.playlistEntry3] =
			await this.playlistEntry.createManyAndReturn({
				data: [
					{
						playlistId: this.playlist1.id,
						songId: this.songA1.id,
						index: 2,
					},
					{
						playlistId: this.playlist1.id,
						songId: this.songA2.id,
						index: 1,
					},
					{
						playlistId: this.playlist1.id,
						songId: this.songC1.id,
						index: 0,
					},
				],
			});
	}
}
