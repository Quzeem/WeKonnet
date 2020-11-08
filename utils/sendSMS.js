const request = require('postman-request');

const sendSMS = (messagetext, phone) => {
  const options = {
    method: 'POST',
    body: JSON.stringify({
      SMS: {
        auth: {
          username: process.env.EBULK_USERNAME,
          apikey: process.env.EBULK_SMS_API_KEY,
        },
        message: {
          sender: 'Jobizil',
          messagetext,
          flash: '0',
        },
        recipients: {
          gsm: [
            {
              msidn: phone,
            },
          ],
        },
      },
    }),
    headers: {
      'content-type': 'application/json',
    },
  };

  request(
    'http://api.ebulksms.com:8080/sendsms.json',
    options,
    (error, response, body) => {
      if (error) {
        return console.error(error);
      }
      const info = JSON.parse(body);
      return console.log(info);
    }
  );
};

module.exports = sendSMS;
