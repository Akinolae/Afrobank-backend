const ACTIONS = {
  FIND: 'find',
  FINDONE: 'findOne',
  CREATE: 'create',
  FINDONEANDUPDATE: 'findOneAndUpdate',
  UPDATEONE: 'updateOne',
  UPDATEMANY: 'updateMany',
};

const dbActionGenerator = async (action = '', params: any): Promise<any> => {
  try {
    const isValidAction = Object.values(ACTIONS).includes(action);

    if (!action || !isValidAction || !Object.keys(params).length) {
      throw new Error(
        !isValidAction
          ? `action must include either of ${Object.keys(ACTIONS).join(', ')}`
          : 'action and params are required for DB update::CONFIGURATION_ERROR',
      );
    } else {
      switch (action) {
        case ACTIONS.FIND:
          return await params.collection.find(...params.data);
        case ACTIONS.FINDONE:
          return await params.collection.findOne(...params.data);
        case ACTIONS.CREATE:
          return await new params.collection(...params.data);
        case ACTIONS.FINDONEANDUPDATE:
          await params.collection.findOneAndUpdate(...params.data);
          break;
        case ACTIONS.UPDATEMANY:
          await params.collection.updateMany(...params.data);
          break;
        case ACTIONS.UPDATEONE:
          await params.collection.updateOne(...params.data);
          break;
        default:
          return null;
      }
    }
  } catch (error) {
    const errors = 'timed out' || 'Could not connect';
    const err = new RegExp(errors).test(error);
    throw err
      ? {
          message: "Network error: Check that you're connected to the internet",
        }
      : error;
  }
};

export { dbActionGenerator, ACTIONS };
