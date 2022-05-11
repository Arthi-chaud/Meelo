import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Track } from 'src/track/models/track.model';

@Table({ tableName: 'libraries' })
export class Library extends Model {
	@Column({ allowNull: false })
	@Unique
	name: string;

	@Column
	path: string;

	@HasMany(() => Track)
	tracks: Track[];


}