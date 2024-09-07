const express = require('express');
const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();
const mongoose = require('mongoose');
const app = express();
const port = 3001;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.log('MongoDB connection error:', err));

// MongoDB Subscription schema
const SubscriptionSchema = new mongoose.Schema({
  smartAccountAddress: String,
  email: String,
  gogginsWalletAddress: String,
});

const Subscriptions = mongoose.model('subscriptions', SubscriptionSchema);

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '0xgetfit@gmail.com',
    pass: process.env.APP_PASS_NEW
  }
});

app.get('/status', async (req, res) => {
  res.status(200).json({ success: true, message: 'Service is live' });
});

app.get('/send-email', async (req, res) => {
  let { userAddress, fitnessCoachAddress } = req.query;

  try {
    // Validate and format wallet address
    if (!userAddress.startsWith('0x')) {
      userAddress = '0x' + userAddress;
    }

    if (!fitnessCoachAddress.startsWith('0x')) {
      fitnessCoachAddress = '0x' + fitnessCoachAddress;
    }

    // Fetch user data from MongoDB
    const user = await Subscriptions.findOne({ smartAccountAddress: userAddress });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Hardcoded coach information
    const coach = {
      name: 'David Goggins',
      image: 'https://images.squarespace-cdn.com/content/v1/511f0ff8e4b083811eaf612c/f8dbfc0f-5e4b-4098-aa2b-bfddbf9b6ade/2024-01-10-Blog+Post+copy.jpg'
    };

    // Prepare and send the email
    const mailOptions = {
      from: '0xgetfit@gmail.com',
      to: user.email,
      subject: `🔥 Your Coach David Goggins Awaits! 🔥`,
      html: `
        <h1 style="color: green;">Hello ${user.email},</h1>
        <p>💪 <strong>David Goggins</strong> is ready to help you crush your fitness goals! Are you?</p>
        <p>Don't miss out on personalized workout plans, tips, and one-on-one coaching with <strong>David Goggins</strong>. Your journey to greatness starts now!</p>
        <p><a href="https://getfit.app/profile/${coach.name.replace(/ /g, '_')}" style="color: #ffffff; background-color: #28a745; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Training Now!</a></p>
        <img src="${coach.image}" alt="Train with David Goggins" style="width: 100%; max-width: 300px; height: auto; display: block; margin: auto;" />
        <p>Stay fit, stay motivated!</p>
        <p>Cheers,<br>The getFit Team 🏋️‍♂️</p>
      `
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        res.status(500).send('Error sending email');
      } else {
        console.log('Email sent: ' + info.response);
        res.status(200).json({ success: true, message: 'Email successfully sent' });
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
