const { addNewField } = require('../../utils/queries')
module.exports = {
  addNewFieldToDb: () => {
    addNewField('cards', 'isActive', true)
  },
}
