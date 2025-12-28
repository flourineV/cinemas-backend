export class FnbOrderItemResponse {
  fnbItemId!: string;
  itemName!: string;
  itemNameEn!: string;
  quantity!: number;
  unitPrice!: string;
  totalPrice!: string;

  constructor(
    fnbItemId: string,
    quantity: number,
    unitPrice: string,
    totalPrice: string,
    itemName: string,
    itemNameEn: string
  ) {
    this.fnbItemId = fnbItemId;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.totalPrice = totalPrice;
    this.itemName = itemName;
    this.itemNameEn = itemNameEn;
  }
}
