import * as dotenv from 'dotenv';
dotenv.config();

import { apiService } from './src/services/apiService.ts';

async function main() {
  try {
    const orders = await apiService.getOrders();
    console.log("Total orders:", orders.length);
    if(orders.length > 0) {
      console.log("First order example:", orders[0]);
    }
  } catch (err: any) {
    console.error("Error getting orders:", err.message);
  }
}

main();
