import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Release } from 'src/release/models/release.model';
import { Song } from 'src/song/models/song.model';

@Table({ tableName: 'tracks' })
export class Track extends Model {
	@ForeignKey(() => Release)
	release: Release;

	@ForeignKey(() => Song)
	song: Song;

	@Column
	displayName: string | null;

	@Column({ allowNull: false })
	master: boolean;

	@Column
	discIndex: number | null;

	@Column
	trackIndex: number | null;

	@Column({ allowNull: false })
	type: TrackType

	@Column({ allowNull: false })
	bitrate: number;

	@Column
	ripSource: RipSource | null;

	@Column({ allowNull: false })
	duration: number;
}