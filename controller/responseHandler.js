module.exports = {
    response: (message, success, code, res, token, data) => {
        res.status(code).json({
            success: success,
            message: message,
            token: token,
            data: data
        })
    }
}