require("dotenv").config();

module.exports = {
  port: process.env.PORT || 8091,
  db: {
    connectionString: process.env.DB_URL,
  },

  bookingServiceUrl: process.env.BOOKING_SERVICE_URL,
  internalSecret: process.env.APP_INTERNAL_SECRET_KEY,
};
