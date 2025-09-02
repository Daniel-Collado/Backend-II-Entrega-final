import TicketDAO from '../daos/TicketDAO.js';

class TicketRepository {
    constructor(dao) {
        this.dao = dao;
    }

    async createTicket(ticketData) {
        return await this.dao.create(ticketData);
    }

    async getTicketById(id) {
        return await this.dao.findById(id);
    }

    async getTicketByCode(code) {
        return await this.dao.findByCode(code);
    }

    async getAllTickets() {
        return await this.dao.find();
    }
}

export default new TicketRepository(TicketDAO);