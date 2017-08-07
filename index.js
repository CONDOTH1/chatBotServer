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
      if (text.includes('£')) {
        rfqObject.loanAmount = parseInt(text.replace(/\u00A3/g, ''), 10);
        botMessages.askForHowLong(sender);
        continue;
      }
      const termArray = ['years', 'days', 'months'];
      if (termArray.includes(text.split(' ')[1])) {
        rfqObject.termPeriod = text.split(' ')[1];
        rfqObject.loanTerm = parseInt(text.split(' ')[0], 10);
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
      botMessages.sendTextMessage(sender, `Text received, echo: ${text.substring(0, 200)}`);
      continue;
    }

    if (event.postback) {
      const text = JSON.stringify(event.postback);
      const parsedTextObject = JSON.parse(text);
      if (parsedTextObject.payload === 'USER ASK TO CREATE A LOAN') {
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
        const quoteDetails = quote.split('::');
        if (quoteDetails[2] === 'pending') {
          botMessages.acceptRejectButtons(sender, quoteDetails[0], quoteDetails[1]);
        } else {
          botMessages.returnToQuotesButton(sender, quoteDetails[0], quoteDetails[3]);
        }
        continue;
      }
      if (parsedTextObject.payload.includes('VIEW MORE RFQS:')) {
        // const rfqNumber = parsedTextObject.payload.split('QUOTES:')[1];
        botMessages.sendTextMessage(sender, 'You\'ve Requested To See More Quotes');
        continue;
      }
      botMessages.sendTextMessage(sender, `Postback received: ${text.substring(0, 200)}`);
      continue;
    }
  }
  res.sendStatus(200);
});
