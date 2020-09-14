module.exports = {
    response: (message, success, code, res, data) => {
        res.status(code).json({
            success: success,
            message: message,
            data: data
        })
    }
}