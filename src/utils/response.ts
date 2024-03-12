import { IResponse } from '../Types/index';

const response = (params: IResponse) => {
  const { code, data, res, success, message, token } = params;
  res.status(code).json({
    success: success,
    message: message,
    token: token,
    data: data,
  });
};

export { response };
