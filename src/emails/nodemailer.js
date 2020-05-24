var nodemailer = require('nodemailer')

const contactUs = (data) => {
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,           //email id
      pass: process.env.PASSWORD       // password
    },
    pool: true
  });
  
  var mailOptions = {
    from: process.env.EMAIL,
    to: data.email,
    subject:data.subject,
    text:data.text
  };
  console.log("mailOptions : " ,mailOptions);
  
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

module.exports = {
    contactUs
}