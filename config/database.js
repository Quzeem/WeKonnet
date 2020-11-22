const mongoose = require('mongoose');
const logger = require('../utils/winstonLogger');

const connectDB = async () => {
  const db = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });
  logger.info(`MongoDB Connected: ${db.connection.host}`);
};

module.exports = connectDB;
