import { DataSource } from "typeorm";
import { Province } from "../models/Province.js";
import type { ProvinceRequest } from "../dto/request/ProvinceRequest.js";
import type { ProvinceResponse } from "../dto/response/ProvinceResponse.js";
import { v4 as uuidv4 } from "uuid";

export class ProvinceService {
  private provinceRepo = this.dataSource.getRepository(Province);

  constructor(private dataSource: DataSource) {}

  async createProvince(request: ProvinceRequest): Promise<ProvinceResponse> {
    const province = this.provinceRepo.create({
      id: uuidv4(),
      name: request.name,
    });
    const saved = await this.provinceRepo.save(province);
    return { id: saved.id, name: saved.name };
  }

  async getProvinceById(id: string): Promise<ProvinceResponse> {
    const province = await this.provinceRepo.findOne({ where: { id } });
    if (!province) throw new Error(`Province with ID ${id} not found`);
    return { id: province.id, name: province.name };
  }

  async getAllProvinces(): Promise<ProvinceResponse[]> {
    const provinces = await this.provinceRepo.find();
    return provinces.map((p) => ({ id: p.id, name: p.name }));
  }

  async updateProvince(id: string, request: ProvinceRequest): Promise<ProvinceResponse> {
    const province = await this.provinceRepo.findOne({ where: { id } });
    if (!province) throw new Error("Province not found");
    province.name = request.name;
    const updated = await this.provinceRepo.save(province);
    return { id: updated.id, name: updated.name };
  }

  async deleteProvince(id: string): Promise<void> {
    await this.provinceRepo.delete(id);
  }
}
