require('dotenv').config()

const generateRandomEmail = () => {
  var char = 'abcdefghijklmnopqrstuvwxyz1234567890'
  var string = ''
  for (var i = 0; i < 12; i++) {
    string += char[Math.floor(Math.random() * char.length)]
  }
  return string + '@gmail.com'
}

module.exports = {
  generateRandomEmail,
}
