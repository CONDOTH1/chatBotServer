/* eslint no-continue: "off" */

const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const botMessages = require('./bot/messages.js');
require('dotenv').config();

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', (req, res) => {
  res.send(res);
});

// for Facebook verification
app.get('/webhook/', (req, res) => {
  if (req.query['hub.verify_token'] === process.env.FACEBOOK_CHALLENGE) {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong token');
});

// Spin up the server
app.listen(app.get('port'), () => {
  console.log('running on port', app.get('port'));
});

const rfqObject = {};

app.post('/webhook/', (req, res) => {
  const messagingEvents = req.body.entry[0].messaging;
  for (let i = 0; i < messagingEvents.length; i++) {
    const event = req.body.entry[0].messaging[i];
    const sender = event.sender.id;

    if (event.message && event.message.text) {
      const text = event.message.text;
      if (text === 'Hello') {
        botMessages.sendWelcomeMenu(sender);
        continue;
      }
      if (!isNaN(parseInt(text, 10)) && parseInt(text, 10) > 100) {
        rfqObject.loanAmount = parseInt(text, 10);
        console.log('+_+_+_+_+_+_+_+_+_+_+_', rfqObject);
        botMessages.selectTermPeriod(sender);
        continue;
      }
      if (!isNaN(parseInt(text, 10)) && parseInt(text, 10) < 100) {
        rfqObject.loanTerm = parseInt(text, 10);
        console.log('+_+_+_+_+_+_+_+_+_+_+_', rfqObject);
        botMessages.sendRFQ(sender, rfqObject);
        continue;
      }
      // const termArray = ['years', 'days', 'months'];
      // if (termArray.includes(text.split(' ')[1])) {
      //   rfqObject.termPeriod = text.split(' ')[1];
      //   rfqObject.loanTerm = parseInt(text.split(' ')[0], 10);
      //   botMessages.sendRFQ(sender, rfqObject);
      //   continue;
      // }
      if (text.includes('Accept') || text.includes('Reject')) {
        const quoteNumber = event.message.quick_reply.payload.split(':');
        botMessages.acceptRejectQuote(sender, quoteNumber);
        continue;
      }
      if (text.includes('Return To Quotes')) {
        const rfqNumber = event.message.quick_reply.payload.split(':')[1];
        botMessages.getQuotesForRfq(sender, rfqNumber);
        continue;
      }
      botMessages.sendTextMessage(sender, 'Sorry, I Didn\'t Recognise That Request');
      continue;
    }

    if (event.postback) {
      const text = JSON.stringify(event.postback);
      const parsedTextObject = JSON.parse(text);
      if (parsedTextObject.payload === 'USER ASK TO CREATE A LOAN') {
        botMessages.selectCurrency(sender);
        continue;
      }
      if (parsedTextObject.payload === 'USER SELECTED GBP') {
        // rfqObject.loanAmount = '£';
        botMessages.askHowMuch(sender);
        continue;
      }
      if (parsedTextObject.payload === 'USER SELECTED DAYS') {
        rfqObject.termPeriod = 'days';
        botMessages.askForHowLong(sender);
        continue;
      }
      if (parsedTextObject.payload === 'USER SELECTED MONTHS') {
        rfqObject.termPeriod = 'months';
        botMessages.askForHowLong(sender);
        continue;
      }
      if (parsedTextObject.payload === 'USER SELECTED YEARS') {
        rfqObject.termPeriod = 'years';
        botMessages.askForHowLong(sender);
        continue;
      }
      if (parsedTextObject.payload === 'USER ASKED TO SEE LOANS') {
        botMessages.getRFQS(sender);
        continue;
      }
      if (parsedTextObject.payload.includes('USER ASKED TO SEE QUOTES:')) {
        const rfqNumber = parsedTextObject.payload.split('QUOTES:')[1];
        botMessages.getQuotesForRfq(sender, rfqNumber);
        continue;
      }
      if (parsedTextObject.payload.includes('USER ASKED TO SEE A QUOTE:')) {
        const quote = parsedTextObject.payload.split('QUOTE:')[1];
        const quoteDetails = quote.split('::');
        if (quoteDetails[2] === 'pending') {
          botMessages.acceptRejectButtons(sender, quoteDetails[0], quoteDetails[1]);
        } else {
          botMessages.returnToQuotesButton(sender, quoteDetails[0], quoteDetails[3]);
        }
        continue;
      }
      if (parsedTextObject.payload.includes('VIEW MORE RFQS')) {
        botMessages.viewMoreRfqs(sender);
        continue;
      }
      if (parsedTextObject.payload.includes('VIEW MORE QUOTES')) {
        botMessages.viewMoreQuotes(sender);
        continue;
      }
      botMessages.sendTextMessage(sender, 'Sorry, I Didn\'t Recognise That Request');
      continue;
    }
  }
  res.sendStatus(200);
});
