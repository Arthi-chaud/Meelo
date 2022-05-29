import { AutoIncrement, BeforeCreate, BeforeUpdate, BelongsTo, Column, DataType, Default, ForeignKey, HasMany, HasOne, Is, Model, Table, Unique } from 'sequelize-typescript';
import { File } from 'src/file/models/file.model';
import { Slug } from 'src/slug/slug';
import { SluggedModel } from 'src/slug/slugged-model';

@Table({ tableName: 'libraries' })
export class Library extends SluggedModel {

	/**
	 * The name of the library, whose slug will be built from
	 */
	@Unique
	@Column({ allowNull: false })
	name: string;

	/**
	 * Path of the library, relative to 'dataFolder' from settings.json
	 */
	@Column({ allowNull: false })
	path: string;

	/**
	 * The files registered in the library
	 */
	@HasMany(() => File)
	files: File[];

	get slugSource(): string {
		return this.name;
	}
}