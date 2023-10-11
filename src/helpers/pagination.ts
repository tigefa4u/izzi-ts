import { PagingMetadata } from "@customTypes/pagination";
import { PAGE_FILTER } from "./constants/constants";

export const paginationParams = async ({ perPage = 10, currentPage = 1 }) => {
	if (currentPage <= 0) currentPage = 1;
	return {
		limit: perPage,
		offset: (currentPage - 1) * perPage,
	};
};

type PagingResultProps<T> = {
  data: T[];
  query: {
    perPage: number;
    currentPage: number;
  };
};

type G = {
  total_count?: number;
};

export const paginationForResult: <T>({
	data,
	query,
}: PagingResultProps<T & G>) => Promise<PagingMetadata> = async <T>({
	data = [],
	query = PAGE_FILTER,
}: PagingResultProps<T & G>) => {
	const total = Number((data[0] || {}).total_count || 0);
	const per_page = Number(query.perPage || 10);
	data.forEach((i: T & G) => delete i.total_count);
	return {
		totalCount: total || 0,
		totalPages: Math.ceil(total / per_page),
		currentPage: Number(query.currentPage) || 1,
		perPage: per_page || 10,
	};
};

export const clientSidePagination = <T>(
	array: T[],
	currentPage: number,
	perPage: number
) => {
	const newArray = array;
	return newArray.slice((currentPage - 1) * perPage, currentPage * perPage);
};
