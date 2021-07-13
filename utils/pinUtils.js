const isPinValid = (data, pin) => {
    if (!data) {
        return
    } else {
        const resp = data === pin
        return resp
    }
}
module.exports = isPinValid
