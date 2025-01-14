import { Injectable } from "@nestjs/common";
import {
	Album,
	AlbumType,
	Artist,
	File,
	Genre,
	Library,
	Lyrics,
	PlaylistEntry,
	Release,
	Song,
	SongType,
	Track,
	TrackType,
	Video,
	VideoType,
} from "@prisma/client";
import Logger from "src/logger/logger";
import { Playlist } from "src/prisma/models";
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

	public compilationAlbumA: Album;
	public compilationReleaseA1: Release;

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

		for (const { tablename } of tablenames) {
			if (tablename !== "_prisma_migrations") {
				try {
					await this.$executeRawUnsafe(
						`TRUNCATE TABLE "public"."${tablename}" CASCADE;`,
					);
				} catch (error) {
					this.logger.error(`Flushing table '${tablename}' failed`);
				}
			}
		}
	}

	/**
	 * Creates dummy data and pushes it to the database using the repository service.
	 * It will also clear previous data
	 */
	override async onModuleInit() {
		await this.$connect();
		await this.flushDatabase();
		this.library1 = await this.library.create({
			data: { name: "Library", path: "Music", slug: "library" },
		});
		this.library2 = await this.library.create({
			data: { name: "Library 2", path: "Music 2/", slug: "library-2" },
		});

		this.genreA = await this.genre.create({
			data: { name: "My Genre A", slug: "my-genre-a" },
		});

		this.genreB = await this.genre.create({
			data: { name: "My Genre B", slug: "my-genre-b" },
		});

		this.genreC = await this.genre.create({
			data: { name: "My Genre C", slug: "my-genre-c" },
		});

		this.artistA = await this.artist.create({
			data: { name: "My Artist", slug: "my-artist" },
		});
		this.albumA1 = await this.album.create({
			data: {
				name: "My Album",
				slug: "my-artist-my-album",
				nameSlug: "my-album",
				artistId: this.artistA.id,
				releaseDate: new Date("2022"),
			},
		});
		this.releaseA1_1 = await this.release.create({
			data: {
				name: "My Album 1",
				slug: "my-artist-my-album-1",
				nameSlug: "my-album-1",
				albumId: this.albumA1.id,
				releaseDate: new Date("2022"),
			},
		});
		this.releaseA1_2 = await this.release.create({
			data: {
				name: "My Album 2",
				slug: "my-artist-my-album-2",
				nameSlug: "my-album-2",
				albumId: this.albumA1.id,
			},
		});
		this.songA1 = await this.song.create({
			data: {
				name: "My Song",
				slug: "my-artist-my-song",
				nameSlug: "my-song",
				artist: { connect: { id: this.artistA.id } },
				genres: {
					connect: [{ id: this.genreA.id }, { id: this.genreB.id }],
				},
				type: SongType.Original,
				group: {
					create: {
						slug: new Slug(this.artistA.name, "my-song").toString(),
					},
				},
			},
		});
		this.lyricsA1 = await this.lyrics.create({
			data: {
				songId: this.songA1.id,
				content: "1234",
			},
		});
		this.fileA1_1 = await this.file.create({
			data: {
				path: "Artist A/Album A/1-02 My Song.m4a",
				checksum: "",
				registerDate: new Date(),
				libraryId: this.library1.id,
				fingerprint: "ACOUSTID",
			},
		});
		this.trackA1_1 = await this.track.create({
			data: {
				name: "My Song 1",
				...this.baseTrack,
				songId: this.songA1.id,
				releaseId: this.releaseA1_1.id,
				type: TrackType.Audio,
				sourceFileId: this.fileA1_1.id,
				trackIndex: 2,
				discIndex: 1,
			},
		});
		this.fileA1_2Video = await this.file.create({
			data: {
				path: "Artist A/Album A/My Song.m4v",
				checksum: "",
				registerDate: new Date(),
				libraryId: this.library1.id,
			},
		});
		this.videoA1 = await this.video.create({
			data: {
				name: "My Song",
				slug: "my-artist-my-song",
				nameSlug: "my-song",
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
		this.trackA1_2Video = await this.track.create({
			data: {
				...this.baseTrack,
				name: "My Song 2 (Video)",
				songId: this.songA1.id,
				discIndex: 2,
				videoId: this.videoA1.id,
				releaseId: this.releaseA1_2.id,
				type: TrackType.Video,
				sourceFileId: this.fileA1_2Video.id,
				masterOfVideo: { connect: { id: this.videoA1.id } },
			},
		});
		//To update master track id
		this.videoA1.masterId = this.trackA1_2Video.id;
		this.songA2 = await this.song.create({
			data: {
				name: "My Other Song",
				slug: "my-artist-my-other-song",
				nameSlug: "my-other-song",
				artist: { connect: { id: this.artistA.id } },
				group: {
					create: {
						slug: new Slug(
							this.artistA.name,
							"my-other-song",
						).toString(),
					},
				},
				genres: { connect: { id: this.genreB.id } },
				type: SongType.Original,
			},
		});
		this.fileA2_1 = await this.file.create({
			data: {
				path: "Artist A/Album B/My Other Song.m4a",
				checksum: "",
				registerDate: new Date(),
				libraryId: this.library1.id,
			},
		});
		this.trackA2_1 = await this.track.create({
			data: {
				...this.baseTrack,
				name: "My Other Song 1",
				songId: this.songA2.id,
				discIndex: 1,
				releaseId: this.releaseA1_2.id,
				type: TrackType.Audio,
				sourceFileId: this.fileA2_1.id,
			},
		});

		this.artistB = await this.artist.create({
			data: { name: "My Second Artist", slug: "my-second-artist" },
		});
		this.albumB1 = await this.album.create({
			data: {
				name: "My Second Album",
				slug: "my-second-artist-my-second-album",
				nameSlug: "my-second-album",
				artistId: this.artistB.id,
			},
		});
		this.releaseB1_1 = await this.release.create({
			data: {
				name: "My Second Album 1",
				slug: "my-second-artist-my-second-album-1",
				nameSlug: "my-second-album-1",
				albumId: this.albumB1.id,
			},
		});
		this.songB1 = await this.song.create({
			data: {
				name: "My Second Song",
				slug: "my-second-artist-my-second-song",
				nameSlug: "my-second-song",
				artist: { connect: { id: this.artistB.id } },
				group: {
					create: {
						slug: new Slug(
							this.artistB.name,
							"my-second-song",
						).toString(),
					},
				},
				genres: { connect: { id: this.genreB.id } },
				type: SongType.Original,
			},
		});
		this.fileB1_1 = await this.file.create({
			data: {
				path: "Artist B/Album B/My Second Song.m4a",
				checksum: "",
				registerDate: new Date(),
				libraryId: this.library2.id,
			},
		});
		this.trackB1_1 = await this.track.create({
			data: {
				...this.baseTrack,
				name: "My Second Song 1",
				songId: this.songB1.id,
				releaseId: this.releaseB1_1.id,
				type: TrackType.Audio,
				sourceFileId: this.fileB1_1.id,
			},
		});

		this.artistC = await this.artist.create({
			data: { name: "My Third Artist", slug: "my-third-artist" },
		});
		this.compilationAlbumA = await this.album.create({
			data: {
				name: "My Compilation Album",
				slug: "compilations-my-compilation-album",
				nameSlug: "my-compilation-album",
				releaseDate: new Date("2000"),
				type: AlbumType.Compilation,
			},
		});
		this.compilationReleaseA1 = await this.release.create({
			data: {
				name: "My Compilation Album 1",
				slug: "compilations-my-compilation-album-1",
				nameSlug: "my-compilation-album-1",
				albumId: this.compilationAlbumA.id,
				releaseDate: new Date("2000"),
			},
		});
		this.songC1 = await this.song.create({
			data: {
				name: "My C Song",
				slug: "my-third-artist-my-c-song",
				nameSlug: "my-c-song",
				artist: { connect: { id: this.artistC.id } },
				group: {
					create: {
						slug: new Slug(
							this.artistC.name,
							"my-c-song",
						).toString(),
					},
				},
				genres: { connect: { id: this.genreC.id } },
				type: SongType.Original,
			},
		});
		this.fileC1_1 = await this.file.create({
			data: {
				path: "Compilations/Album C/My C Song.m4a",
				checksum: "",
				registerDate: new Date(),
				libraryId: this.library1.id,
			},
		});
		this.trackC1_1 = await this.track.create({
			data: {
				...this.baseTrack,
				name: "My C Song 1",
				songId: this.songC1.id,
				discIndex: 3,
				releaseId: this.compilationReleaseA1.id,
				type: TrackType.Audio,
				sourceFileId: this.fileC1_1.id,
			},
		});
		this.playlist1 = await this.playlist.create({
			data: {
				name: "My Playlist 1",
				slug: "my-playlist-1",
				createdAt: new Date("2000-01-01"),
			},
		});
		this.playlist2 = await this.playlist.create({
			data: {
				name: "The Playlist 2",
				slug: "the-playlist-2",

				createdAt: new Date("2000-01-02"),
			},
		});
		this.playlist3 = await this.playlist.create({
			data: {
				name: "Playlist 3",
				slug: "playlist-3",

				createdAt: new Date("2000-01-03"),
			},
		});
		this.playlistEntry2 = await this.playlistEntry.create({
			data: {
				playlistId: this.playlist1.id,
				songId: this.songA1.id,
				index: 2,
			},
		});
		this.playlistEntry1 = await this.playlistEntry.create({
			data: {
				playlistId: this.playlist1.id,
				songId: this.songA2.id,
				index: 1,
			},
		});
		this.playlistEntry3 = await this.playlistEntry.create({
			data: {
				playlistId: this.playlist1.id,
				songId: this.songC1.id,
				index: 0,
			},
		});
	}
}
