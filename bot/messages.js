const request = require('request');
const rp = require('request-promise');
const ta = require('time-ago')();

const token = process.env.PAGE_ACCESS_TOKEN;

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

function sendWelcomeMenu(sender) {
  const messageData = {
    attachment: {
      type: 'template',
      payload: {
        template_type: 'button',
        text: 'What do you want to do next?',
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

function askHowMuch(sender) {
  const messageData = {
    text: 'How Much Would You Like A Loan For?'
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
    const listTemplate = JSON.parse(results).rfqs.map(rfq => ({
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

    const listGroupOfFour = listTemplate.length > 4 ? listTemplate.splice(0, 4) : listTemplate;

    const messageData = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: 'compact',
          elements: listGroupOfFour
        }
      }
    };
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
    const listTemplate = results.quotes.map(quote => ({
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
    }));

    const listGroupOfFour = listTemplate.length > 4 ? listTemplate.splice(0, 4) : listTemplate;

    const messageData = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'list',
          top_element_style: 'compact',
          elements: listGroupOfFour
        }
      }
    };
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
        text: `You Have ${payloadArray[0]}ed The Offer!`
      };
      sendRequest(sender, messageData);
    });
}

function acceptRejectButtons(sender, quoteDetails, quoteNumber) {
  const messageData = {
    text: quoteDetails,
    quick_replies: [
      {
        content_type: 'text',
        title: 'Reject',
        payload: `reject:${quoteNumber}`,
        image_url: 'http://www.colorcombos.com/images/colors/FF0000.png'
      },
      {
        content_type: 'text',
        title: 'Accept',
        payload: `accept:${quoteNumber}`,
        image_url: 'http://www.colorcombos.com/images/colors/00FF00.png'
      }
    ]
  };
  sendRequest(sender, messageData);
}

function returnToQuotesButton(sender, quoteDetails, rfqNumber) {
  const messageData = {
    text: quoteDetails,
    quick_replies: [
      {
        content_type: 'text',
        title: 'Return To Quotes',
        payload: `RETURN TO QUOTES:${rfqNumber}`,
        image_url: 'http://www.colorcombos.com/images/colors/000084.png'
      }
    ]
  };
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
  returnToQuotesButton
};
