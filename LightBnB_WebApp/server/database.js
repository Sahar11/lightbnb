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
      if (user.id === id) {
        return Promise.resolve(user);
      } else {
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
  // 1
  const queryParams = [];
  // 2
  let queryString = `SELECT p.*,
  ROUND(AVG(pr.rating)) AS average_rating
FROM properties p
  JOIN property_reviews pr ON property_id = p.id `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += ` WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.owner_id}`);
      queryString += ` AND p.owner_id = $${queryParams.length} `;
    } else {
      queryParams.push(`%${options.owner_id}%`);
      queryString += ` WHERE p.owner_id = $${queryParams.length} `;
    }
  }

  if (options.minimum_price_per_night) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.minimum_price_per_night}`);
      queryString += ` AND p.cost_per_night >= $${queryParams.length}`;
    } else {
      queryParams.push(`${options.minimum_price_per_night}`);
      queryString += ` WHERE p.cost_per_night >= $${queryParams.length}`;
    }
  }

  if (options.maximum_price_per_night) {
    if (queryParams.length >= 1) {
      queryParams.push(`${options.maximum_price_per_night}`);
      queryString += ` AND p.cost_per_night <= $${queryParams.length} `;
    } else {
      queryParams.push(`${options.maximum_price_per_night}`);
      queryString += ` WHERE p.cost_per_night <= $${queryParams.length} `;
    }
  }


  queryString += `GROUP BY p.id`;

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += ` HAVING AVG(pr.rating) >= $${queryParams.length} `;
  }

  // 4
  queryParams.push(limit);
  queryString += ` ORDER BY p.cost_per_night ASC
  LIMIT $${queryParams.length};`;

  return pool.query(queryString, queryParams)
    .then((data) => {
      return Promise.resolve(data.rows);
    });
};


exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {

  const queryString = `INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms, country, street, city, province, post_code, active)
  VALUES ($1, $2 , $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true )
  RETURNING * ;`
  const values = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code];

  return pool.query(queryString, values)
    .then((result) => {
      return Promise.resolve((result.rows[0]));
    }).catch((err) => {
      return Promise.reject(err.message);
    });
}
exports.addProperty = addProperty;
