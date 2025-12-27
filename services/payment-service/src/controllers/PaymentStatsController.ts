import { Router } from 'express';
import type { Request, Response } from 'express';
import { Logger } from 'winston';
import { PaymentStatsService } from '../services/PaymentStatsService.js';
import type {
  PaymentStatsResponse
} from '../dto/response/PaymentStatsResponse';
import type {RevenueStatsResponse} from '../dto/response/RevenueStatsResponse.js'
import { requireManagerOrAdmin } from '../middleware/authChecker.js';
import { AppDataSource } from '../data-source.js';

const paymentStatsService = new PaymentStatsService(AppDataSource);
const logger = new Logger();
const router = Router();
  /**
   * GET /api/payments/stats/overview
   * Get payment statistics overview
   */
router.get('/stats',requireManagerOrAdmin, async(req: Request, res: Response) => {
    try {
      // Note: Payment stats cannot be filtered by theater (no bookingId/theaterId in payment table)
      // Both Manager and Admin see all payment stats
      const stats: PaymentStatsResponse = await paymentStatsService.getOverview();

      res.status(200).json(stats);
    } catch (error) {
      logger.error('Error getting payment overview', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(error instanceof Error && error.message.includes('403') ? 403 : 500)
        .json({ error: errorMessage });
    }
});
  /**
   * GET /api/payments/stats/revenue
   * Get revenue statistics
   */
router.get('/revenue', requireManagerOrAdmin, async(req: Request, res: Response)=>{
    try {
      const { year, month } = req.query;

      const yearNum = year ? parseInt(year as string, 10) : undefined;
      const monthNum = month ? parseInt(month as string, 10) : undefined;

      // Note: Payment stats cannot be filtered by theater (no bookingId/theaterId in payment table)
      // Both Manager and Admin see all payment stats
      const stats: RevenueStatsResponse[] = await paymentStatsService.getRevenueStats(
        yearNum,
        monthNum
      );

      res.status(200).json(stats);
    } catch (error) {
      logger.error('Error getting revenue stats', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(error instanceof Error && error.message.includes('403') ? 403 : 500)
        .json({ error: errorMessage });
    }
});
    
export default router;

