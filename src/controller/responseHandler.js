module.exports = {
  response: (message, success, code, res, token, data) => {
    res.status(code).json({
      success: success,
      message:
        code >= 400
          ? `${
              process.env.NODE_ENV === 'development' ? 'SANDBOX' : 'production'
            }: ${message}`
          : message,
      token: token,
      data: data,
    })
  },
}
