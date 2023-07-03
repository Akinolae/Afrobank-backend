const { addNewField } = require('../../queries/queries')
module.exports = {
  addNewFieldToDb: () => {
    addNewField('cards', 'isActive', true)
  },
}
