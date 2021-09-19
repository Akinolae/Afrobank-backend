const fs = require('fs')

const logError = (path, content) => {
    if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(path, JSON.stringify(content), (err, resp) => {
            if (err) throw err
            else return resp
        })
    } else return
}

module.exports = {
    logError,
}
