import { v4 as uuidv4 } from "uuid";
import { FnbItemDto } from "../dtos/request/FnbItemDto";
import { FnbItemRequest } from "../dtos/request/FnbItemRequest";
import { CalculatedFnbItemDto } from "../dtos/response/CalculatedFnbItemDto";
import { FnbCalculationResponse } from "../dtos/response/FnbCalculationResponse";
import { FnbItemResponse } from "../dtos/response/FnbItemResponse";
import { FnbItem } from "../models/FnbItem.entity";
import { FnbItemRepository } from "../repositories/FnbItemRepository";
import { CloudinaryService } from "./CloudinaryService";

export class FnbService {
  private fnbItemRepository: FnbItemRepository;
  private cloudinaryService: CloudinaryService;

  constructor(
    fnbItemRepository: FnbItemRepository,
    cloudService: CloudinaryService
  ) {
    this.fnbItemRepository = fnbItemRepository;
    this.cloudinaryService = cloudService;
  }

  async calculateTotalPrice(
    selectedFnbItems: FnbItemDto[]
  ): Promise<FnbCalculationResponse> {
    const fnbIds = selectedFnbItems.map((item) => item.fnbItemId);
    const fnbEntities = await this.fnbItemRepository.findAllByIdIn(fnbIds);

    const fnbMap = new Map<string, FnbItem>();
    fnbEntities.forEach((item) => fnbMap.set(item.id, item));

    const calculatedItems: CalculatedFnbItemDto[] = [];
    let grandTotal = 0;

    for (const itemDto of selectedFnbItems) {
      const fnbItem = fnbMap.get(itemDto.fnbItemId);
      if (!fnbItem) {
        console.warn(
          `F&B Item ID ${itemDto.fnbItemId} not found. Skipping calculation.`
        );
        continue;
      }

      const unitPrice = Number(fnbItem.unitPrice);
      const itemTotal = unitPrice * itemDto.quantity;
      grandTotal += itemTotal;

      calculatedItems.push({
        fnbItemId: itemDto.fnbItemId,
        quantity: itemDto.quantity,
        unitPrice: unitPrice.toString(),
        totalFnbItemPrice: itemTotal.toString(),
      });
    }

    console.info(`Total F&B price calculated: ${grandTotal}`);

    return {
      totalFnbPrice: grandTotal.toString(),
      calculatedFnbItems: calculatedItems,
    };
  }

  async getAllFnbItems(): Promise<FnbItemResponse[]> {
    const items = await this.fnbItemRepository.findAll();
    return items.map(this.mapToResponse);
  }

  async getFnbItemById(id: string): Promise<FnbItemResponse> {
    const item = await this.fnbItemRepository.findById(id);
    if (!item) {
      console.error(`F&B Item not found with ID: ${id}`);
      throw new Error(`F&B Item not found with ID: ${id}`);
    }
    return this.mapToResponse(item);
  }

  async createFnbItem(request: FnbItemRequest): Promise<FnbItemResponse> {
    const exists = await this.fnbItemRepository.existsByName(request.name);
    if (exists) {
      throw new Error(`F&B Item with name '${request.name}' already exists.`);
    }

    const newItem: FnbItem = {
      id: uuidv4(),
      name: request.name,
      description: request.description,
      unitPrice: request.unitPrice,
      imageUrl: request.imageUrl,
      nameEn: request.nameEn,
      descriptionEn: request.descriptionEn,
    };

    const savedItem = await this.fnbItemRepository.save(newItem);
    console.info(`➕ Created F&B item: ${savedItem.name}`);
    return this.mapToResponse(savedItem);
  }

  async updateFnbItem(
    id: string,
    request: FnbItemRequest
  ): Promise<FnbItemResponse> {
    const existingItem = await this.fnbItemRepository.findById(id);
    if (!existingItem) {
      throw new Error(`F&B Item not found with ID: ${id}`);
    }

    existingItem.name = request.name;
    existingItem.description = request.description;
    existingItem.unitPrice = request.unitPrice;
    existingItem.imageUrl = request.imageUrl;

    const updatedItem = await this.fnbItemRepository.save(existingItem);
    console.info(`Updated F&B item: ${updatedItem.name}`);
    return this.mapToResponse(updatedItem);
  }

  async deleteFnbItem(id: string): Promise<void> {
    const exists = await this.fnbItemRepository.existsById(id);
    if (!exists) {
      throw new Error(`F&B Item not found with ID: ${id}`);
    }
    const fnb_item = await this.fnbItemRepository.findById(id);
    if (!fnb_item) {
      throw new Error(`F&B Item not found with ID: ${id}`);
    }
    await this.cloudinaryService.deleteFileByUrl(fnb_item.imageUrl);
    await this.fnbItemRepository.deleteById(id);
    console.warn(`Deleted F&B item with ID: ${id}`);
  }

  private mapToResponse(item: FnbItem): FnbItemResponse {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      unitPrice: item.unitPrice,
      imageUrl: item.imageUrl,
      nameEn: item.nameEn,
      descriptionEn: item.descriptionEn,
    };
  }
}
