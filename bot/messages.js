const request = require('request');
const rp = require('request-promise');
const helper = require('./../helper/helper.js');

const token = process.env.PAGE_ACCESS_TOKEN;
let rfqsListTemplate;
let quotesListTemplate;

// ################### SEND MESSAGE AS CHATBOT #########################

function sendRequest(sender, messageData) {
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: token },
    method: 'POST',
    json: {
      recipient: { id: sender },
      message: messageData
    }
  }, (error, response, body) => {
    if (error) {
      console.log('Error sending messages: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

// ################ CONSTRUCT MESSAGES, LISTS AND BUTTONS ##################

function sendTextMessage(sender, text) {
  const messageData = { text };
  sendRequest(sender, messageData);
}

function sendWelcomeMenu(sender, isFirstInteraction) {
  if (isFirstInteraction) {
    const text = "Hi, i'm Duchess, welcome, what can I do for you today?";
    sendRequest(sender, { text });
  }
  const messageData = helper.mainMenu();
  sendRequest(sender, messageData);
}

function askHowMuch(sender) {
  const messageData = {
    text: 'How Much Would You Like A Loan For?'
  };
  sendRequest(sender, messageData);
}

function selectTermPeriod(sender) {
  const messageData = { text: 'Please Select Term Period', quick_replies: [] };
  messageData.quick_replies.push(helper.quickRepliesButton('Days', 'USER SELECTED DAYS'));
  messageData.quick_replies.push(helper.quickRepliesButton('Months', 'USER SELECTED MONTHS'));
  messageData.quick_replies.push(helper.quickRepliesButton('Years', 'USER SELECTED YEARS'));
  sendRequest(sender, messageData);
}

function askForHowLong(sender) {
  const messageData = { text: 'For How Long?' };
  sendRequest(sender, messageData);
}

function viewMoreRfqs(sender) {
  const endOfRfqList = rfqsListTemplate.length <= 4;
  const listGroupOfFour = endOfRfqList ? rfqsListTemplate : rfqsListTemplate.splice(0, 4);
  const messageData = helper.createListTemplate(listGroupOfFour, 'VIEW MORE RFQS', endOfRfqList);
  sendRequest(sender, messageData);
}

function viewMoreQuotes(sender) {
  const endOfQuoteList = quotesListTemplate.length <= 4;
  const listGroupOfFour = endOfQuoteList ? quotesListTemplate : quotesListTemplate.splice(0, 4);
  const messageData = helper.createListTemplate(listGroupOfFour, 'VIEW MORE QUOTES', endOfQuoteList);
  sendRequest(sender, messageData);
}


function acceptRejectQuoteButtons(sender, quoteDetails, quoteNumber, rfqNumber) {
  const messageData = { text: quoteDetails, quick_replies: [] };
  messageData.quick_replies.push(helper.quickRepliesButton('Reject', `reject:${quoteNumber}`, 'http://www.colorcombos.com/images/colors/FF0000.png'));
  messageData.quick_replies.push(helper.quickRepliesButton('Accept', `accept:${quoteNumber}`, 'http://www.colorcombos.com/images/colors/00FF00.png'));
  messageData.quick_replies.push(helper.quickRepliesButton('Return To Quotes', `RETURN TO QUOTES:${rfqNumber}`, 'http://www.colorcombos.com/images/colors/000084.png'));
  sendRequest(sender, messageData);
}

function returnToQuotesButton(sender, quoteDetails, rfqNumber) {
  const messageData = { text: quoteDetails, quick_replies: [] };
  messageData.quick_replies.push(helper.returnButton('Return To Quotes', `RETURN TO QUOTES:${rfqNumber}`));
  sendRequest(sender, messageData);
}

// ################ API CALLS TO RFQENGING #########################

function sendRFQ(sender, rfqObject) {
  const params = {
    headers: { 'x-spoke-client': process.env.CLIENT_TOKEN },
    uri: 'https://zqi6r2rf99.execute-api.eu-west-1.amazonaws.com/testing/rfqs',
    method: 'POST',
    body: rfqObject,
    json: true
  };

  return rp(params)
    .then(() => {
      const messageData = { text: 'Your loan request has been sent!' };
      sendRequest(sender, messageData);
      sendWelcomeMenu(sender, false);
    });
}

function getRFQS(sender) {
  const params = {
    headers: { 'x-spoke-client': process.env.CLIENT_TOKEN },
    uri: 'https://zqi6r2rf99.execute-api.eu-west-1.amazonaws.com/testing/rfqs',
    method: 'GET'
  };

  return rp(params)
  .then((results) => {
    rfqsListTemplate = helper.createRfqList(results);
    const endOfRfqList = rfqsListTemplate.length <= 4;
    const listGroupOfFour = endOfRfqList ? rfqsListTemplate : rfqsListTemplate.splice(0, 4);
    const messageData = helper.createListTemplate(listGroupOfFour, 'VIEW MORE RFQS', endOfRfqList);
    sendRequest(sender, messageData);
  });
}


function getQuotesForRfq(sender, rfqNumber) {
  const params = {
    headers: { 'x-spoke-client': process.env.CLIENT_TOKEN },
    uri: 'https://zqi6r2rf99.execute-api.eu-west-1.amazonaws.com/testing/quotes',
    method: 'POST',
    body: { rfqNumber },
    json: true
  };

  return rp(params)
  .then((results) => {
    quotesListTemplate = helper.createQuoteList(results, rfqNumber);
    const endOfQuoteList = quotesListTemplate.length <= 4;
    const listGroupOfFour = endOfQuoteList ? quotesListTemplate : quotesListTemplate.splice(0, 4);
    const messageData = helper.createListTemplate(listGroupOfFour, 'VIEW MORE QUOTES', endOfQuoteList);

    sendRequest(sender, messageData);
  });
}

function acceptRejectQuote(sender, payloadArray) {
  const params = {
    headers: { 'x-spoke-client': process.env.CLIENT_TOKEN },
    uri: 'https://zqi6r2rf99.execute-api.eu-west-1.amazonaws.com/testing/quotes',
    method: 'PUT',
    body: { quoteNumber: payloadArray[1], status: payloadArray[0] },
    json: true
  };

  return rp(params)
    .then(() => {
      const messageData = {
        text: `You have ${payloadArray[0]}ed the offer!`
      };
      sendRequest(sender, messageData);
      sendWelcomeMenu(sender, false);
    });
}


module.exports = {
  sendTextMessage,
  sendWelcomeMenu,
  askHowMuch,
  askForHowLong,
  sendRFQ,
  getRFQS,
  getQuotesForRfq,
  acceptRejectQuote,
  acceptRejectQuoteButtons,
  returnToQuotesButton,
  viewMoreRfqs,
  viewMoreQuotes,
  selectTermPeriod
};
