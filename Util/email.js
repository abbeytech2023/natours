const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) Create a tansporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      // user: process.env.EMAIL_USERNAME,
      user: process.env.EMAIL_USERNAME,
      password: process.env.EMAIL_PASSWORD,
      secure: false,
    },
  });
  //2) Define the email options
  const mailOptions = {
    from: 'Jonas Schmedtmann <hello@abbey.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  //3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
