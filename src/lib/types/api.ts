export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: {
        data: T[];
        pagination: Pagination;
    };
    message?: string;
    error?: string;
}
