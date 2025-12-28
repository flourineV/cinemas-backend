import { v4 as uuidv4 } from "uuid";
import { FnbOrderRequest } from "../dtos/request/FnbOrderRequest";
import { FnbOrderItemResponse } from "../dtos/response/FnbOrderItemResponse";
import { FnbOrderResponse } from "../dtos/response/FnbOrderResponse";
import { FnbOrder } from "../models/FnbOrder.entity";
import { FnbOrderItem } from "../models/FnbOrderItem.entity";
import { FnbOrderStatus } from "../models/FnbOrderStatus.entity";
import { FnbOrderCreatedEvent } from "../events/FnbOrderCreatedEvent";
import { FnbProducer } from "../producers/FnbProducer";
import { FnbItemRepository } from "../repositories/FnbItemRepository";
import { FnbOrderRepository } from "../repositories/FnbOrderRepository";

export class FnbOrderService {
  private fnbOrderRepository: FnbOrderRepository;
  private fnbItemRepository: FnbItemRepository;
  private fnbProducer: FnbProducer;

  constructor(
    fnbOrderRepository: FnbOrderRepository,
    fnbItemRepository: FnbItemRepository,
    fnbProducer: FnbProducer
  ) {
    this.fnbOrderRepository = fnbOrderRepository;
    this.fnbItemRepository = fnbItemRepository;
    this.fnbProducer = fnbProducer;
  }

  async createOrder(request: FnbOrderRequest): Promise<FnbOrderResponse> {
    let total = 0;
    const orderItems: FnbOrderItem[] = [];

    for (const i of request.items) {
      const item = await this.fnbItemRepository.findById(i.fnbItemId);
      if (!item) {
        throw new Error("FNB item not found");
      }

      const subtotal = Number(item.unitPrice) * i.quantity;
      total += subtotal;

      const orderItem: FnbOrderItem = {
        fnbItemId: item.id,
        quantity: i.quantity,
        unitPrice: item.unitPrice,
        totalPrice: subtotal.toString(),
        id: uuidv4(),
        order: null as any,
      };

      orderItems.push(orderItem);
    }

    const order: FnbOrder = {
      id: uuidv4(),
      userId: request.userId,
      theaterId: request.theaterId,
      orderCode: `FNB-${Date.now()}`,
      status: FnbOrderStatus.PENDING,
      paymentMethod: request.paymentMethod,
      totalAmount: total.toString(),
      createdAt: new Date(),
      items: orderItems,
      updatedAt: new Date(),
      paymentId: null as any,
      language: request.language,
    };

    orderItems.forEach((i) => (i.order = order));

    const saved = await this.fnbOrderRepository.save(order);

    // Gửi event sang Payment Service
    const event: FnbOrderCreatedEvent = {
      fnbOrderId: saved.id,
      userId: saved.userId,
      theaterId: saved.theaterId,
      totalAmount: saved.totalAmount,
    };
    await this.fnbProducer.sendFnbOrderCreatedEvent(event);

    console.info(
      `FnbOrder created: ${saved.id} | theaterId=${saved.theaterId} | total=${saved.totalAmount}`
    );

    return await this.mapToResponse(saved);
  }

  async getOrdersByUser(userId: string): Promise<FnbOrderResponse[]> {
    const orders = await this.fnbOrderRepository.findByUserId(userId);
    return Promise.all(orders.map((o) => this.mapToResponse(o)));
  }

  async getById(id: string): Promise<FnbOrderResponse> {
    const order = await this.fnbOrderRepository.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }
    return await this.mapToResponse(order);
  }

  async cancelOrder(id: string): Promise<void> {
    const order = await this.fnbOrderRepository.findById(id);
    if (!order) {
      throw new Error("Order not found");
    }
    order.status = FnbOrderStatus.CANCELLED;
    await this.fnbOrderRepository.save(order);
  }

  private async mapToResponse(o: FnbOrder): Promise<FnbOrderResponse> {
    // Calculate expiration time for PENDING orders (5 minutes TTL)
    const expiresAt =
      o.status === FnbOrderStatus.PENDING
        ? new Date(o.createdAt.getTime() + 5 * 60 * 1000)
        : null;

    // Map items with FnbItem details
    const items = await Promise.all(
      o.items.map(async (i) => {
        // Get item name from FnbItem
        const fnbItem = await this.fnbItemRepository.findById(i.fnbItemId);
        const itemName = fnbItem ? fnbItem.name : "Unknown Item";
        const itemNameEn = fnbItem ? fnbItem.nameEn || "" : "";

        return new FnbOrderItemResponse(
          i.fnbItemId,
          i.quantity,
          i.unitPrice,
          i.totalPrice,
          itemName,
          itemNameEn
        );
      })
    );

    return {
      id: o.id,
      userId: o.userId,
      theaterId: o.theaterId,
      orderCode: o.orderCode,
      status: o.status.toString(),
      paymentMethod: o.paymentMethod,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt,
      expiresAt: expiresAt,
      items: items,
    };
  }
}
