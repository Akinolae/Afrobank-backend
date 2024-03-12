const error = (error: any) => {
  let message: string;
  if (!!error || !!Object.keys(error).length) {
    message = error;
  }

  if (!!error.message) {
    message = error.message;
  }

  return `Error: ${message}`;
};

export default error;
