import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { Nullable } from '@types';

@Entity('media')
export class MediaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  assetId: string;

  @Column({ type: 'varchar', length: 255 })
  publicId: string;

  @Column({ type: 'varchar', length: 20 })
  format: string;

  @Column({ type: 'varchar', length: 50 })
  resourceType: string;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'bigint' })
  bytes: number;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  assetFolder: Nullable<string>;

  @Column({ type: 'varchar', length: 255 })
  displayName: string;

  @Column({ type: 'varchar', length: 500 })
  secureUrl: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  recordCreatedAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  recordUpdatedAt: Date;
}
