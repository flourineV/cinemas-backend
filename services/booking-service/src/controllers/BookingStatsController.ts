import { Router } from 'express';
import type { Request, Response, NextFunction} from 'express';
import { BookingStatsService } from '../services/BookingStatsService.js';
import type { BookingStatsResponse } from '../dto/response/BookingStatsResponse.js';
import type { RevenueStatsResponse } from '../dto/response/RevenueStatsResponse.js';
import { requireManagerOrAdmin, isManager } from '../middleware/authChecker.js';
import type { RequestWithUserContext  } from 'types/userContext.js';
import { createBookingStatsService } from '../shared/instances.js';

const router = Router();
const bookingStatsService = createBookingStatsService();
//GET /api/bookings/stats/overview
router.get('/overview', requireManagerOrAdmin, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const theaterId = req.query.theaterId as string | undefined;
        if (isManager(req.userContext) && !theaterId) {
            return res.status(400).json({
                timestamp: new Date().toISOString(),
                status: 400,
                error: 'Bad Request',
                message: 'Manager must provide theaterId parameter',
            });
        }

        const result: BookingStatsResponse = await bookingStatsService.getOverview(theaterId);
        return res.json(result);
    } catch (err) {
        next(err);
    }
});
//GET /api/bookings/stats/revenue
router.get('/revenue', requireManagerOrAdmin, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
        const month = req.query.month ? parseInt(req.query.month as string, 10) : undefined;
        const theaterId = req.query.theaterId as string | undefined;
        const provinceId = req.query.provinceId as string | undefined;

        if (isManager(req.userContext) && !theaterId) {
            return res.status(400).json({
            timestamp: new Date().toISOString(),
            status: 400,
            error: 'Bad Request',
            message: 'Manager must provide theaterId parameter',}
            );
        }

    const result: RevenueStatsResponse[] = await bookingStatsService.getRevenueStats(
        year,
        month,
        theaterId,
        provinceId
    );
        return res.json(result);
    } catch (err) {
        next(err);
    }
});

export default router;
