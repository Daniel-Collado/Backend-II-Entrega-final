import { Router } from 'express';
import TicketController from '../controllers/TicketController.js';
import { isAuthenticated, authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/tickets - Obtener todos los tickets (solo admin)
router.get('/', isAuthenticated, authorizeRoles('admin'), TicketController.getAllTickets.bind(TicketController));

// GET /api/tickets/:code - Obtener un ticket por código (comprador o admin)
router.get('/:code', isAuthenticated, TicketController.getTicketByCode.bind(TicketController));

export default router;