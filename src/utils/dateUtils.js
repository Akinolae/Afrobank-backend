const createExpiryDate = (currentDate, years) => {
  const today = new Date(currentDate)
  const year = today.getFullYear()
  const month = today.getMonth()
  const day = today.getDate()
  return new Date(year + years, month, day)
}

module.exports = {
  createExpiryDate,
}
