const request = require('request');
const rp = require('request-promise');
const helper = require('./../helper/helper.js');
const calendarButtons = require('./../helper/calendarButtons.js');
const ta = require('time-ago')();

const token = process.env.PAGE_ACCESS_TOKEN;
let rfqsListTemplate;
let quotesListTemplate;

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

function sendTextMessage(sender, text) {
  const messageData = { text };
  sendRequest(sender, messageData);
}

function sendWelcomeMenu(sender, isFirstInteraction) {
  if (isFirstInteraction) {
    const welcomeMessage = 'Hi, welcome to the JigsawBot';
    sendRequest(sender, welcomeMessage);
  }
  const messageData = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Please Select An Action Below To Continue?',
        buttons: [
          {
            type: 'postback',
            title: 'Get A Loan',
            payload: 'USER ASK TO CREATE A LOAN'
          },
          {
            type: 'postback',
            title: 'See Loan Requests',
            payload: 'USER ASKED TO SEE LOANS'
          }
        ]
      }
    }
  };
  sendRequest(sender, messageData);
}

function selectCurrency(sender) {
  const messageData = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'Please Select Your Currency',
        buttons: [
          {
            type: 'postback',
            title: 'GBP £',
            payload: 'USER SELECTED GBP'
          }
        ]
      }
    }
  };
  sendRequest(sender, messageData);
}

function askHowMuch(sender) {
  const messageData = {
    text: 'How Much Would You Like A Loan For?'
  };
  sendRequest(sender, messageData);
}

function selectTermPeriod(sender) {
  const messageData = {
    text: 'Please Select Term Period',
    quick_replies: [
      {
        content_type: 'text',
        title: 'Days',
        payload: 'USER SELECTED DAYS'
      },
      {
        content_type: 'text',
        title: 'Months',
        payload: 'USER SELECTED MONTHS'
      },
      {
        content_type: 'text',
        title: 'Years',
        payload: 'USER SELECTED YEARS'
      }
    ]
  };
  sendRequest(sender, messageData);
}

function askForHowLong(sender) {
  const messageData = {
    text: 'For How Long?'
  };
  sendRequest(sender, messageData);
}

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
      const messageData = {
        text: 'Your loan request has been sent!'
      };
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
    rfqsListTemplate = JSON.parse(results).rfqs.map(rfq => ({
      title: `Your request for £${rfq.payload.loanAmount} over ${rfq.payload.loanTerm} ${rfq.payload.termPeriod}`,
      subtitle: `Created ${ta.ago(rfq.createdTimeStamp)}`,
      buttons: [
        {
          type: 'postback',
          title: 'Check For Quotes',
          payload: `USER ASKED TO SEE QUOTES:${rfq.rfqNumber}`
        }
      ]
    }));

    const endOfRfqList = rfqsListTemplate.length <= 4;
    const listGroupOfFour = endOfRfqList ? rfqsListTemplate : rfqsListTemplate.splice(0, 4);
    const messageData = helper.createListTemplate(listGroupOfFour, 'VIEW MORE RFQS', endOfRfqList);
    sendRequest(sender, messageData);
  });
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
    quotesListTemplate = results.quotes.reduce((result, quote) => {
      if (quote.status === 'declined') {
        return result;
      }
      result.push({
        title: `${quote.quotePayload.providerName} can offer a loan of £${quote.quotePayload.borrowingAmount} at ${quote.quotePayload.representativeApr}%`,
        subtitle: `Valid For ${Math.ceil((quote.timeToLive - new Date()) / 86400000)} Days`,
        buttons: quote.status !== 'pending' ? [
          {
            type: 'postback',
            title: `View: ${quote.status}ed`,
            payload: `USER ASKED TO SEE A QUOTE:Provider:${quote.quotePayload.providerName}\n Amount: £${quote.quotePayload.borrowingAmount}\n For: ${quote.quotePayload.loanTerm} ${quote.quotePayload.loanPeriod}\n Repayment: £${quote.quotePayload.repaymentAmountPerSchedule} ${quote.quotePayload.repaymentSchedule}\n Total Repayment: £${quote.quotePayload.repaymentAmountTotal}\n APR: ${quote.quotePayload.representativeApr}%\n Status: ${quote.status}::${quote.quoteNumber}::${quote.status}::${rfqNumber}`
          // payload: `OFFER ALREADY ACCEPTED: ${rfqNumber}`
          }
        ] : [
          {
            type: 'postback',
            title: 'View',
            payload: `USER ASKED TO SEE A QUOTE:Provider:${quote.quotePayload.providerName}\n Amount: £${quote.quotePayload.borrowingAmount}\n For: ${quote.quotePayload.loanTerm} ${quote.quotePayload.loanPeriod}\n Repayment: £${quote.quotePayload.repaymentAmountPerSchedule} ${quote.quotePayload.repaymentSchedule}\n Total Repayment: £${quote.quotePayload.repaymentAmountTotal}\n APR: ${quote.quotePayload.representativeApr}%\n Status: ${quote.status}::${quote.quoteNumber}::${quote.status}::${rfqNumber}`
          // payload: `VIEW QUOTE: ${quote.quoteNumber}`
          }
        ]
      });

      return result;
    }, []);

    const endOfQuoteList = quotesListTemplate.length <= 4;
    const listGroupOfFour = endOfQuoteList ? quotesListTemplate : quotesListTemplate.splice(0, 4);
    const messageData = helper.createListTemplate(listGroupOfFour, 'VIEW MORE QUOTES', endOfQuoteList);

    // const listGroupOfFour = quotesListTemplate.length > 4 ? quotesListTemplate.splice(0, 4) : quotesListTemplate;
    // const messageData = helper.createQuoteList(listGroupOfFour, 'VIEW MORE QUOTES');

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

function acceptRejectButtons(sender, quoteDetails, quoteNumber, rfqNumber) {
  const messageData = { text: quoteDetails, quick_replies: [] };
  messageData.quick_replies.push(helper.acceptButton(`reject:${quoteNumber}`));
  messageData.quick_replies.push(helper.rejectButton(`accept:${quoteNumber}`));
  messageData.quick_replies.push(helper.returnButton('Return To Quotes', `RETURN TO QUOTES:${rfqNumber}`));
  sendRequest(sender, messageData);
}

function returnToQuotesButton(sender, quoteDetails, rfqNumber) {
  // const messageData = helper.returnToQuotesButton(quoteDetails, rfqNumber);
  const messageData = { text: quoteDetails, quick_replies: [] };
  messageData.quick_replies.push(helper.returnButton('Return To Quotes', `RETURN TO QUOTES:${rfqNumber}`));
  sendRequest(sender, messageData);
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
  acceptRejectButtons,
  returnToQuotesButton,
  viewMoreRfqs,
  viewMoreQuotes,
  selectCurrency,
  selectTermPeriod
};
