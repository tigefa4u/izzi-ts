export type PaginationProps = {
    limit: number;
    offset: number;
}

export type PageProps = {
    current_page: number;
    per_page: number;
}

export interface PagingMetadata extends PageProps {
    total_count: number;
    total_pages: number;
}
