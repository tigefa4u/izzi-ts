export type PaginationProps = {
    limit: number;
    offset: number;
}

export type PageProps = {
    currentPage: number;
    perPage: number;
}

export interface PagingMetadata extends PageProps {
    totalCount: number;
    totalPages: number;
}
