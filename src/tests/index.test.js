const chai = require('chai')
const chaiHttp = require('chai-http')
const { app } = require('../afrobankserver')
const { generateRandomEmail } = require('../utils/emailUtils')

chai.should()
chai.use(chaiHttp)

//successful Login
describe('/POST login', async () => {
  it('it should return 200', (done) => {
    chai
      .request(app)
      .post(`/Api/v1/login`)
      .send({ email: 'makindeakinola22@gmail.com', password: 'Thegreatest@1' })
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
  })

  it('it should return 401', (done) => {
    chai
      .request(app)
      .post(`/Api/v1/login`)
      .send({ email: generateRandomEmail(), password: 'Thegreatest@1' })
      .end((err, res) => {
        res.should.have.status(401)
        done()
      })
  })
})

describe('/GET banks', async () => {
  it('it should return bank lists', (done) => {
    chai
      .request(app)
      .get('/Api/v1/bankList')
      .end((err, res) => {
        res.should.have.status(200)
        done()
      })
  })
})
