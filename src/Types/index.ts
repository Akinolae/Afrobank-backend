type IResponse = {
  message?: string | object;
  success: boolean;
  token?: string;
  code: number;
  data?: string | object;
  res: any;
};

export { IResponse };
