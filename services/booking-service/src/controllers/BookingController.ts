import { Router } from 'express';
import type {Request, Response, NextFunction} from 'express';
import { BookingService } from '../services/BookingService.js';
import { requireInternal } from '../middleware/internalAuthChecker.js';
import { requireInternalOrAuth } from '../middleware/internalOrAuthChecker.js';
import { requireAuthenticated, requireAdmin, getUserIdOrThrow } from '../middleware/authChecker.js';
import type { RequestWithUserContext } from '../types/userContext.js';
import type { CreateBookingRequest } from '../dto/request/CreateBookingRequest.js';
import type { FinalizeBookingRequest } from '../dto/request/FinalizeBookingRequest.js';
import type { BookingCriteria } from '../dto/request/BookingCriteria.js';
import type { BookingResponse } from '../dto/response/BookingResponse.js';
import type { PagedResponse } from '../dto/response/PagedResponse.js';
import { BookingStatus } from '../models/BookingStatus.js';
import { createBookingService } from '../shared/instances.js'

const router = Router();
const bookingService = createBookingService();
//POST /api/bookings
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body as CreateBookingRequest;
        const booking: BookingResponse = await bookingService.createBooking(body);
        return res.json(booking);
    } catch (err) {
        next(err);
    }
});
// GET /api/bookings/admin/search - Admin search with many optional filters and pagination
router.get('/admin/search', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            keyword,
            userId,
            username,
            showtimeId,
            movieId,
            bookingCode,
            status,
            paymentMethod,
            guestName,
            guestEmail,
            fromDate,
            toDate,
            minPrice,
            maxPrice,
            page = '0',
            size = '10',
            sortBy = 'createdAt',
            sortDir = 'desc',
        } = req.query as Record<string, string | undefined>;
        const statusQuery = status as string | undefined;

        let parsedStatus: BookingStatus | undefined;
        if (statusQuery && Object.values(BookingStatus).includes(statusQuery as BookingStatus)) {
            parsedStatus = statusQuery as BookingStatus;
        } else {
            parsedStatus = undefined; // invalid or missing value
        }
        // Build criteria object
        const criteria: BookingCriteria = {};
        if (keyword) criteria.keyword = keyword;
        if (userId) criteria.userId = userId;
        if (username) criteria.username = username;
        if (showtimeId) criteria.showtimeId = showtimeId;
        if (movieId) criteria.movieId = movieId;
        if (bookingCode) criteria.bookingCode = bookingCode;
        if (parsedStatus) criteria.status = parsedStatus;
        if (paymentMethod) criteria.paymentMethod = paymentMethod;
        if (guestName) criteria.guestName = guestName;
        if (guestEmail) criteria.guestEmail = guestEmail;
        if (fromDate) criteria.fromDate = fromDate;
        if (toDate) criteria.toDate = toDate;
        if (minPrice) criteria.minPrice = minPrice;
        if (maxPrice) criteria.maxPrice = maxPrice;

        const pageNumber = parseInt(page, 10) || 0;
        const pageSize = parseInt(size, 10) || 10;

        // Call service
        const response = await bookingService.getBookingsByCriteria(
            criteria,
            pageNumber,
            pageSize,
            sortBy,
            sortDir
        );

        return res.json(response);
    } catch (err) {
        next(err);
    }
});

//GET /api/bookings/check - Check if user has booked a movie. If internal key not provided or invalid, require authentication.
router.get('/check', requireInternalOrAuth, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        const movieId = req.query.movieId as string;

        if (!userId || !movieId) {
            return res.status(400).json({ error: 'Missing required query parameters: userId and movieId' });
        }

        const hasBooked = await bookingService.hasUserBookedMovie(userId, movieId);
        return res.json({ hasBooked });
    } catch (err) {
        next(err);
    }
});

//GET /api/bookings/count - Get booking count by user id. If internal key not provided or invalid, require authentication.
router.get('/count', requireInternalOrAuth, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
    const userId = req.query.userId as string;
    
    const count = await bookingService.getBookingCountByUserId(userId);
    return res.json(count);
    } catch (err) {
        next(err);
    }
});
//GET /api/bookings/user/:userId - Get bookings by user (authenticated)
router.get('/user/:userId', requireAuthenticated, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const userId = req.params.userId;
        if(!userId){
            return res.json(404).json({ message: 'User ID is required' });
        }
        const bookings: BookingResponse[] = await bookingService.getBookingsByUser(userId);
        return res.json(bookings);
    } catch (err) {
        next(err);
    }
});

// GET /api/bookings/:id - Get booking by id (authenticated)
router.get('/:id', requireAuthenticated, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        if(!id){
            return res.json(404).json({ message: 'Booking ID is required' });
        }
        const booking: BookingResponse = await bookingService.getBookingById(id);
        return res.json(booking);
    } catch (err) {
        next(err);
    }
});
  
// PATCH /api/bookings/:id/finalize - Finalize booking (authenticated)
router.patch('/:id/finalize', requireAuthenticated, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const bookingId = req.params.id;
        if (!bookingId) {
            return res.status(400).json({ message: 'Booking ID is required' });
        }
        const body = req.body as FinalizeBookingRequest;
        const response: BookingResponse = await bookingService.finalizeBooking(bookingId, body);
        return res.json(response);
    } catch (err) {
        next(err);
    }
});

//POST /api/bookings/:id/cancel - Cancel booking (authenticated)
router.post('/:id/cancel', requireAuthenticated, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: 'Booking ID is required' });
        }
        
        const userId = getUserIdOrThrow(req.userContext);
        const response: BookingResponse = await bookingService.cancelBooking(id, userId);
        return res.json(response);
    } catch (err) {
        next(err);
    }
});

//DELETE /api/bookings/:id - Delete booking (admin only)
router.delete('/:id', requireAdmin, async (req: RequestWithUserContext, res: Response, next: NextFunction) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ message: 'Booking ID is required' });
        }
        await bookingService.deleteBooking(id);
        return res.status(204).send();
    } catch (err) {
        next(err);
    }
});



export default router;

