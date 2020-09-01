const localStrategy = require("passport-local").Strategy;
const dataBase = require("../../config/database/dbconnect");

module.exports = (passport) => {
  passport.use(
    new localStrategy(
      {
        usernameField: "accountnumber",
        passwordField: "firstname",
      },
      (accountnumber, firstname, done) => {
        const msg = [];
        if (!accountnumber) {
          msg.push({
            message: "Account number cannot be empty",
          });
        } else {
          dataBase.query(
            "SELECT * FROM customers WHERE accountNumber = ? ",
            [accountnumber],
            (err, data) => {
              if (err) {
                return done(null, false);
              }
              user = data[0].firstname === firstname;
              if (!user) {
                return done(
                  null,
                  false,
                  msg.push({
                    message: "unable to complet",
                  })
                );
              }
              if (user) {
                return done(null, data[0]);
              }
            }
          );
        }
      }
    )
  );
  passport.serializeUser(function (user, done) {
    done(null, user);
  });
  passport.deserializeUser(function (obj, done) {
    done(null, obj);
  });
};
