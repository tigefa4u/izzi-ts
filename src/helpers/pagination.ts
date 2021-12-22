export const paginationParams = async ({ perPage = 10, currentPage = 1 }) => {
	return {
		limit: perPage,
		offset: (currentPage - 1) * perPage
	};
};

type PagingResultProps<T> = {
    data: T[],
    query: {
        perPage: number;
        currentPage: number;
    }
}

export const paginationForResult = async <T>({
	data = [], query = {
		perPage: 10,
		currentPage: 1 
	} 
}: PagingResultProps<T>) => {
	const total = Number(data[0].total_count || 0);
	const per_page = Number(query.perPage || 10);
	data.forEach((i: T) => delete i.total_count);
	return {
		total_count: total || 0,
		total_pages: Math.ceil(total / per_page),
		currentPage: Number(query.currentPage) || 1,
		perPage: per_page || 10
	};
};