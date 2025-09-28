export const getPaginationOptions = (query: any, defaultPageSize: number) => {
    const page = parseInt(query.page, 10) || 1;
    const pageSize = parseInt(query.pageSize, 10) || defaultPageSize;
    return {
        take: pageSize,
        skip: (page - 1) * pageSize,
        page,
        pageSize,
    };
};

export const formatPaginationResponse = (data: any[], totalRecords: number, page: number, pageSize: number, meta: any = {}) => {
    const totalPages = Math.ceil(totalRecords / pageSize);
    return {
        currentPage: page,
        pageSize,
        totalRecords,
        totalPages,
        data,
        meta
    };
};
