import ticketModel from '../models/ticket.model.js';

class TicketDAO {
    async create(data) {
        try {
            const newTicketDoc = await ticketModel.create(data);
            return newTicketDoc;
        } catch (error) {
            console.error('Error al crear ticket en DAO:', error);
            throw error; // Re-throw to propagate the error
        }
    }

    async findById(id) {
        return await ticketModel.findById(id).lean();
    }

    async findByCode(code) {
        return await ticketModel.findOne({ code }).populate({
            path: 'products.product',
            select: 'title description'
        })
        .lean();
    }

    async find() {
        try {
            return await ticketModel.find().lean();
        } catch (error) {
            console.error('Error al obtener todos los tickets en DAO:', error);
            throw error;
        }
    }
}

export default new TicketDAO();
