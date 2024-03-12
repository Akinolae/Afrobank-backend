import { ACTIONS, dbActionGenerator } from '../lib/mongoose';
import customer from '../Model/user.model';

// Queries that act as the primary mode of communication with the database
// Written to ensure reusability and easy debugging and also maintain a single source of truth

const queries = {
  updateToDb: async (data?: any, action?: any, collection = customer) => {
    return await dbActionGenerator(!action ? ACTIONS.UPDATEONE : action, {
      collection,
      data: [...data],
    });
  },
  getFromDb: async (data, action, collection = customer) => {
    return await dbActionGenerator(!action ? ACTIONS.FIND : action, {
      collection,
      data: [...data],
    });
  },
};

export { queries };
