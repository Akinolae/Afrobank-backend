const user = require('../../controller/userManagement/index')

module.exports = {
  addNewFieldToDb: () => {
    user.createNewField()
  },
}
