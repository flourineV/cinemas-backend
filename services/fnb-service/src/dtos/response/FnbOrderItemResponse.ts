export class FnbOrderItemResponse {
  fnbItemId!: string;
  itemName!: string;
  quantity!: number;
  unitPrice!: string;
  totalPrice!: string;

  constructor(
    fnbItemId: string,
    quantity: number,
    unitPrice: string,
    totalPrice: string,
    itemName: string
  ) {
    this.fnbItemId = fnbItemId;
    this.quantity = quantity;
    this.unitPrice = unitPrice;
    this.totalPrice = totalPrice;
    this.itemName = itemName;
  }
}
