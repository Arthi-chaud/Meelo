import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Release } from 'src/release/models/release.model';

@Table({ tableName: 'tracks' })
export class Track extends Model {
	@HasOne(() => Release)
	release: Release;

	@HasOne(() => Song)
	song: Song;

	@Column
	displayName: string | null;

	@Column({ allowNull: false })
	master: boolean;

	@Column
	discIndex: number | null;

	@Column
	trackIndex: number | null;
}