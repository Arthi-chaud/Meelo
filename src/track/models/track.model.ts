import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Release } from 'src/release/models/release.model';
import { Song } from 'src/song/models/song.model';

/**
 * An track is an 'instance' of a song
 */
@Table({ tableName: 'tracks' })
export class Track extends Model {
	/**
	 * The parent release the track can be found on
	 */
	@ForeignKey(() => Release)
	release: Release;

	/**
	 * The reference song
	 */
	@ForeignKey(() => Song)
	song: Song;

	/**
	 * The display name of the track
	 * If null, the parent song's title will be used
	 */
	@Column
	displayName?: string;

	/**
	 * Is this track the 'main' one
	 */
	@Column({ allowNull: false })
	master: boolean;

	/**
	 * The index of the disc the track is on
	 */
	@Column
	discIndex?: number;

	/**
	 * The index of the track on the disc
	 */
	@Column
	trackIndex?: number;

	/**
	 * Type of track (Audio or Video)
	 */
	@Column({ allowNull: false })
	type: TrackType

	/**
	 * Bitrate, in kbps
	 */
	@Column({ allowNull: false })
	bitrate: number;

	/**
	 * The type of source the track is ripped from
	 */
	@Column
	ripSource?: RipSource;

	/**
	 * The duration in seconds of the track
	 */
	@Column({ allowNull: false })
	duration: number;
}