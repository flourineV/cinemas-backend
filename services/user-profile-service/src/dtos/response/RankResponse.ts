export class RankResponse {
    id: string;      
    name: string;
    minPoints: number;
    maxPoints?: number;
    discountRate: number;
    createdAt: Date;
    updatedAt: Date;
  
    constructor(
      id: string,
      name: string,
      minPoints: number,
      discountRate: number,
      createdAt: Date,
      updatedAt: Date,
      maxPoints?: number
    ) {
      this.id = id;
      this.name = name;
      this.minPoints = minPoints;
      this.discountRate = discountRate;
      this.createdAt = createdAt;
      this.updatedAt = updatedAt;
      this.maxPoints = maxPoints;
    }
  }
  