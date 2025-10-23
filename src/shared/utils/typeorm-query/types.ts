import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { SortOrder } from '@types';

export interface BaseArgs<EntityLike extends ObjectLiteral> {
  queryBuilder: SelectQueryBuilder<EntityLike>;
}

export interface PaginationArgs<EntityLike extends ObjectLiteral> extends BaseArgs<EntityLike> {
  page?: number;
  perPage?: number;
}

export interface SortingArgs<EntityLike extends ObjectLiteral> extends BaseArgs<EntityLike> {
  sortBy?: keyof EntityLike;
  order?: SortOrder;
  customSorts?: Record<string, string>;
}

export interface SearchArgs<EntityLike extends ObjectLiteral> extends BaseArgs<EntityLike> {
  q?: string;
  searchBy?: (keyof EntityLike)[];
}

export interface FilterArgs<EntityLike extends ObjectLiteral> extends BaseArgs<EntityLike> {
  filters?: Partial<Record<keyof EntityLike, string>>;
}
