import TicketRepository from '../repositories/TicketRepository.js';
import { v4 as uuidv4 } from 'uuid'; // Códigos únicos!

class TicketService {
    constructor(ticketRepository) {
        this.ticketRepository = ticketRepository;
    }

    async createTicket(amount, purchaserEmail, productsPurchased) {
        const newTicketData = {
            code: uuidv4(), 
            purchase_datetime: new Date(),
            amount: amount,
            purchaser: purchaserEmail,
            products: productsPurchased.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price 
            }))
        };
        try {
            const createdTicket = await this.ticketRepository.createTicket(newTicketData);
            return createdTicket; 
        } catch (error) {
            console.error('Error al crear ticket en servicio:', error);
            throw error; 
        }
    }

    async getTicketById(id) {
        return await this.ticketRepository.getTicketById(id);
    }

    async getTicketByCode(code) {
        return await this.ticketRepository.getTicketByCode(code);
    }
}

export default new TicketService(TicketRepository);
