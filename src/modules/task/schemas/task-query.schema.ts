import { FilteringSchema } from '@schemas/filtering-query.schema.js';
import { PaginationSchema } from '@schemas/pagination.schema.js';
import { createSearchQuerySchema } from '@schemas/search-query.schema.js';
import { createSortingQuerySchema } from '@schemas/sorting-query.schema.js';

const SearchQuerySchema = createSearchQuerySchema(['title', 'description']);
const SortingQuerySchema = createSortingQuerySchema([
  'createdAt',
  'id',
  'title',
  'status',
  'priority',
]);

export const TaskQuerySchema = SearchQuerySchema.extend(SortingQuerySchema.shape)
  .extend(PaginationSchema.shape)
  .extend(FilteringSchema.shape);
