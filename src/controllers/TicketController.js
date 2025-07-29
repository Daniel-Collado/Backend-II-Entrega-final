import TicketService from '../services/TicketService.js';

class TicketController {
  // Obtener todos los tickets (solo admin)
    async getAllTickets(req, res) {
        try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. Solo los administradores pueden ver todos los tickets.',
            });
        }
        const tickets = await TicketService.ticketRepository.dao.find();
        res.json({ status: 'success', payload: tickets });
        } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }

    // Obtener un ticket por código (comprador o admin)
    async getTicketByCode(req, res) {
        try {
        const ticketCode = req.params.code;
        const ticket = await TicketService.getTicketByCode(ticketCode);
        if (!ticket) {
            return res.status(404).json({
            status: 'error',
            message: 'Ticket no encontrado.',
            });
        }
        if (req.user.role !== 'admin' && req.user.email !== ticket.purchaser) {
            return res.status(403).json({
            status: 'error',
            message: 'Acceso denegado. No tienes permisos para ver este ticket.',
            });
        }
        res.json({ status: 'success', payload: ticket });
        } catch (error) {
        console.error('Error al obtener ticket por código:', error);
        res.status(500).json({ status: 'error', message: 'Error en el servidor' });
        }
    }
}

export default new TicketController();