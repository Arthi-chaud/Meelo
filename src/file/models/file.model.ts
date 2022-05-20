import { Column, ForeignKey, Is, Model, Table, Unique } from 'sequelize-typescript';
import { Library } from 'src/library/models/library.model';

@Table({ tableName: 'files' })
export class File extends Model {
	@Unique
	@Column({ allowNull: false })
	path: string;

	@Is('MD5 Checksum', (value) => RegExp('^[a-f0-9]{32}$').test(value))
	@Column({ allowNull: false })
	md5Checksum: string;

	@Column({ allowNull: false })
	registerDate: Date;

	@ForeignKey(() => Library)
	library: Library;
}