const error = (error) => {
  let message
  if (!!error || !!Object.keys(error).length) {
    message = error
  }

  if (!!error.message) {
    message = error.message
  }

  return `Error: ${message}`
}

module.exports = error
