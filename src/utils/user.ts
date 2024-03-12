import { ACTIONS } from '../lib/mongoose';
import { queries } from '../Queries/index.query';

const getValueFromAttributes = (attributes = [], params) => {
  return attributes.find((user) => user.Name === params).Value;
};

const fetch_single_user = async (params, byEmail = true) => {
  try {
    params = byEmail ? { email: params } : { user_id: params };
    const isAvailable = await queries.getFromDb([params], ACTIONS.FINDONE);
    return isAvailable === null || isAvailable === undefined
      ? { status: false, message: 'invalid email address or password' }
      : { status: true, message: isAvailable };
  } catch (err) {
    throw err;
  }
};
export { getValueFromAttributes, fetch_single_user };
