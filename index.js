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
let settingAmountGBP = false;
let settingTermPeriod = false;

app.post('/webhook/', (req, res) => {
  const messagingEvents = req.body.entry[0].messaging;
  for (let i = 0; i < messagingEvents.length; i++) {
    const event = req.body.entry[0].messaging[i];
    const sender = event.sender.id;
    const welcomes = ['Hello', 'hello', 'Hi', 'hi', 'Sup', 'sup'];
    if (event.message && event.message.text) {
      const text = event.message.text;

      if (welcomes.includes(text)) {
        botMessages.sendWelcomeMenu(sender, true);
        continue;
      }

      if (!isNaN(parseInt(text, 10)) && settingAmountGBP) {
        rfqObject.loanAmount = parseInt(text, 10);
        settingAmountGBP = false;
        settingTermPeriod = true;
        botMessages.selectTermPeriod(sender);
        continue;
      }

      if (!isNaN(parseInt(text, 10)) && settingTermPeriod) {
        settingTermPeriod = false;
        rfqObject.loanTerm = parseInt(text, 10);
        botMessages.sendRFQ(sender, rfqObject);
        continue;
      }

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

      if (text.includes('Days')) {
        rfqObject.termPeriod = 'days';
        botMessages.askForHowLong(sender);
        continue;
      }

      if (text.includes('Months')) {
        rfqObject.termPeriod = 'months';
        botMessages.askForHowLong(sender);
        continue;
      }

      if (text.includes('Years')) {
        rfqObject.termPeriod = 'years';
        botMessages.askForHowLong(sender);
        continue;
      }

      botMessages.sendTextMessage(sender, 'Sorry, I Didn\'t Recognise That Request');
      continue;
    }

    if (event.postback) {
      const text = JSON.stringify(event.postback);
      const parsedTextObject = JSON.parse(text);

      if (parsedTextObject.payload === 'USER ASKED TO CREATE A LOAN') {
        settingAmountGBP = true;
        botMessages.askHowMuch(sender);
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
        const detailsArray = quote.split('::');
        const quoteDetails = detailsArray[0];
        const quoteNumber = detailsArray[1];
        const status = detailsArray[2];
        const rfqNumber = detailsArray[3];

        if (status === 'pending') {
          botMessages.acceptRejectQuoteButtons(sender, quoteDetails, quoteNumber, rfqNumber);
        } else {
          botMessages.returnToQuotesButton(sender, quoteDetails, rfqNumber);
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
