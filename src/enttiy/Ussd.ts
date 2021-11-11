import {
	Entity,
	PrimaryGeneratedColumn,
	Column,
	CreateDateColumn,
	BaseEntity,
} from 'typeorm';

@Entity('SIMREG_CORE_TBL_USSD_AGENTS')
export class USSD extends BaseEntity {
	@PrimaryGeneratedColumn()
	ID!: number;

	@Column()
	SESSION_ID!: string;

	@Column()
	AGENT_ID!: string;

	@Column()
	MSISDN!: string;

	@Column()
	OPTION!: string;

	@Column({
		nullable: true,
	})
	FORENAMES!: string;

	@Column({
		nullable: true,
	})
	SURNAME!: string;

	@Column({
		nullable: true,
	})
	PIN_NUMBER!: string;

	@Column({
		nullable: true,
	})
	DOB!: string;

	@Column({
		nullable: true,
	})
	GENDER!: string;

	@Column({
		nullable: true,
	})
	NEXTOFKIN!: string;

	@Column({
		nullable: true,
	})
	CELLID!: string;

	@CreateDateColumn()
	TIMESTAMP!: Date;
}
