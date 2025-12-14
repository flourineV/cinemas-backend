// import { FnbOrderRepository } from "../repositories/FnbOrderRepository";
// import { FnbItemRepository } from "../repositories/FnbItemRepository";
// import { FnbProducer } from "../producer/FnbProducer";
// import { FnbOrderRequest } from "../dtos/request/FnbOrderRequest";
// import { FnbOrderResponse } from "../dtos/response/FnbOrderResponse";
// import { FnbOrderItemResponse } from "../dtos/response/FnbOrderItemResponse";
// import { FnbOrder } from "../models/FnbOrder.entity";
// import { FnbOrderItem } from "../models/FnbOrderItem.entity";
// import { FnbOrderStatus } from "../models/FnbOrderStatus.entity";

// export class FnbOrderService {
//   private fnbOrderRepository: FnbOrderRepository;
//   private fnbItemRepository: FnbItemRepository;
//   private fnbProducer: FnbProducer;

//   constructor(
//     fnbOrderRepository: FnbOrderRepository,
//     fnbItemRepository: FnbItemRepository,
//     fnbProducer: FnbProducer
//   ) {
//     this.fnbOrderRepository = fnbOrderRepository;
//     this.fnbItemRepository = fnbItemRepository;
//     this.fnbProducer = fnbProducer;
//   }

//   async createOrder(request: FnbOrderRequest): Promise<FnbOrderResponse> {
//     let total = 0;

//     const orderItems: FnbOrderItem[] = [];
//     for (const i of request.items) {
//       const item = await this.fnbItemRepository.findById(i.fnbItemId);
//       if (!item) {
//         throw new Error("FNB item not found");
//       }

//       const subtotal = Number(item.unitPrice) * i.quantity;
//       total += subtotal;

//       const orderItem = new FnbOrderItem();
//       orderItem.fnbItemId = item.id;
//       orderItem.quantity = i.quantity;
//       orderItem.unitPrice = item.unitPrice;
//       orderItem.totalPrice = subtotal.toString();
//       orderItems.push(orderItem);
//     }

//     const order = new FnbOrder();
//     order.userId = request.userId;
//     order.theaterId = request.theaterId;
//     order.orderCode = "FNB-" + Date.now();
//     order.status = FnbOrderStatus.PENDING;
//     order.paymentMethod = request.paymentMethod;
//     order.totalAmount = total.toString();
//     order.createdAt = new Date();
//     order.items = orderItems;
//     orderItems.forEach((i) => (i.order = order));

//     const saved = await this.fnbOrderRepository.save(order);

//     // gửi event sang Payment Service
//     this.fnbProducer.sendFnbOrderCreatedEvent({
//       id: saved.id,
//       userId: saved.userId,
//       theaterId: saved.theaterId,
//       totalAmount: saved.totalAmount,
//     });

//     console.log(
//       `FnbOrder created: ${saved.id} | theaterId=${saved.theaterId} | total=${saved.totalAmount}`
//     );

//     return this.mapToResponse(saved);
//   }

//   async getOrdersByUser(userId: string): Promise<FnbOrderResponse[]> {
//     const orders = await this.fnbOrderRepository.findByUserId(userId);
//     return orders.map((o) => this.mapToResponse(o));
//   }

//   async getById(id: string): Promise<FnbOrderResponse> {
//     const order = await this.fnbOrderRepository.findById(id);
//     if (!order) throw new Error("Order not found");
//     return this.mapToResponse(order);
//   }

//   async cancelOrder(id: string): Promise<void> {
//     const order = await this.fnbOrderRepository.findById(id);
//     if (!order) throw new Error("Order not found");
//     order.status = FnbOrderStatus.CANCELLED;
//     await this.fnbOrderRepository.save(order);
//   }

//   private mapToResponse(o: FnbOrder): FnbOrderResponse {
//     return {
//       id: o.id,
//       userId: o.userId,
//       theaterId: o.theaterId,
//       orderCode: o.orderCode,
//       status: o.status,
//       paymentMethod: o.paymentMethod,
//       totalAmount: o.totalAmount,
//       createdAt: o.createdAt,
//       items: o.items.map(
//         (i) =>
//           ({
//             fnbItemId: i.fnbItemId,
//             quantity: i.quantity,
//             unitPrice: i.unitPrice,
//             totalPrice: i.totalPrice,
//           }) as FnbOrderItemResponse
//       ),
//     };
//   }
// }
