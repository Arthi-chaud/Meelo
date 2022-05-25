import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { File } from 'src/file/models/file.model';
import { Slug } from 'src/slug/slug';
import { SluggedModel } from 'src/slug/slugged-model';

@Table({ tableName: 'libraries' })
export class Library extends SluggedModel {

	@Unique
	@Column({ allowNull: false })
	name: string;

	@Column({ allowNull: false })
	path: string;

	@HasMany(() => File)
	files: File[];

	get slugSource(): string {
		return this.name;
	}
}