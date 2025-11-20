import { Long } from "typeorm";

export class StatsOverviewResponse {
  totalUsers: number;
  totalCustomers: number;
  totalStaff: number;
  totalManagers: number;
  totalAdmins: number;

  constructor(
    totalUsers: number,
    totalCustomers: number,
    totalStaff: number,
    totalManagers: number,
    totalAdmins: number
  ) {
    this.totalUsers = totalUsers;
    this.totalCustomers = totalCustomers;
    this.totalStaff = totalStaff;
    this.totalManagers = totalManagers;
    this.totalAdmins = totalAdmins;
  }
}
