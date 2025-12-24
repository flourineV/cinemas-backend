import { LoyaltyHistoryResponse } from "./LoyaltyHistoryResponse";

export class PagedLoyaltyHistoryResponse {
  data: LoyaltyHistoryResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;

  constructor(
    data: LoyaltyHistoryResponse[],
    page: number,
    size: number,
    totalElements: number,
    totalPages: number
  ) {
    this.data = data;
    this.page = page;
    this.size = size;
    this.totalElements = totalElements;
    this.totalPages = totalPages;
  }
}
