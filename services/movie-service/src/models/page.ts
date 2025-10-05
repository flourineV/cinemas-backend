export type Page<T> = {
  content: T[];
  pageable: { pageNumber: number; pageSize: number };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  number: number;
  size: number;
  numberOfElements: number;
};
export const makePage = <T>(
  items: T[],
  page0: number,
  size: number,
  total: number
): Page<T> => {
  const totalPages = Math.max(1, Math.ceil(total / size));
  return {
    content: items,
    pageable: { pageNumber: page0, pageSize: size },
    totalElements: total,
    totalPages,
    last: page0 + 1 >= totalPages,
    first: page0 === 0,
    number: page0,
    size,
    numberOfElements: items.length,
  };
};
