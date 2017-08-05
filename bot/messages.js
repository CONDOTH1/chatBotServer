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

function getRFQS(sender) {
  const params = {
    headers: { 'x-spoke-client': process.env.CLIENT_TOKEN },
    uri: 'https://zqi6r2rf99.execute-api.eu-west-1.amazonaws.com/testing/rfqs',
    method: 'GET'
  };

  return rp(params)
  .then((results) => {
    const listTemplate = JSON.parse(results).rfqs.map(rfq => ({
      title: `Your Loan Request for £${rfq.payload.loanAmount} over ${rfq.payload.termPeriod} ${rfq.payload.loanTerm}`,
      subtitle: `Created ${ta.ago(rfq.createdTimeStamp)}`,
      buttons: [
        {
          type: 'postback',
          title: `Your Loan for ${rfq.payload.loanAmount}`,
          payload: `RFQ: ${rfq.rfqNumber}`
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

module.exports = {
  sendTextMessage,
  getRFQS
};
