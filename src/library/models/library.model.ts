import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { File } from 'src/file/models/file.model';
import { Track } from 'src/track/models/track.model';

@Table({ tableName: 'libraries' })
export class Library extends Model {
	@Unique
	@Column({ allowNull: false })
	name: string;

	@Column
	path: string;

	@HasMany(() => File)
	files: File[];
}