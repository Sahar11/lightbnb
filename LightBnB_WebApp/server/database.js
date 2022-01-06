const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  queryString = `SELECT name, email, password, id FROM users WHERE email = $1`;
  const values = [email];

  return pool.query(queryString, values)
    .then((data) => {
      user = data.rows[0];
      if (user.email === email) {
        return Promise.resolve(user);
      } else {
        user = null;
        return Promise.reject(user);
      }
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
const queryString = `SELECT * FROM users WHERE id = $1`;
const values = [id];
return pool.query(queryString, values)
.then((result) => {
  user = result.rows[0];
  if(user.id === id) {
    return Promise.resolve(user);
  }else {
    user = null;
    return Promise.reject(user);
  }
});
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
const queryString = `INSERT INTO users (name, email, password)
VALUES ($1, $2, $3)
RETURNING *` ;
const values = [user.name, user.email, user.password];
return pool.query(queryString, values)
.then((result) => {
  return Promise.resolve((result.rows[0]));
}).catch((err) => {
  return Promise.reject(err.message);
});


  // const userId = Object.keys(users).length + 1;
  // user.id = userId;
  // users[userId] = user;
  // return Promise.resolve(user);
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  const queryString = `SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating FROM reservations 
  JOIN users ON users.id = reservations.guest_id
  JOIN properties ON properties.id = property_id
  JOIN property_reviews ON reservations.id = reservation_id
  WHERE reservations.guest_id = $1
  GROUP BY reservations.id, properties.id
 `;
  const values = [limit];
  return pool.query(queryString, values)
.then((result) => {
  return Promise.resolve(result.rows);
})
  .catch((err) => {
    console.log(err.message);
  });
};

exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  const limitedProperties = {};
  return pool
    .query(`SELECT * FROM properties LIMIT $1`, [limit])
    .then((result) => result.rows)
    .catch((err) => {
      console.log(err.message);
    });
};


exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;
