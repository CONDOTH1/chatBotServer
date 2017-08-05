'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const rp = require('request-promise');
const ta = require('time-ago')();
const app = express();
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
  const messaging_events = req.body.entry[0].messaging;
  for (let i = 0; i < messaging_events.length; i++) {
    const event = req.body.entry[0].messaging[i];
    const sender = event.sender.id;
    if (event.message && event.message.text) {
  	    const text = event.message.text;
  	    if (text === 'Generic') {
  		    sendGenericMessage(sender);
  		    continue;
      }
      if (text.includes('£')) {
        rfqObject.loanAmount = parseInt(text.replace(/\u00A3/g, ''));
        askForHowLong(sender);
        continue;
      }
      const termArray = ['years', 'days', 'months'];
      if (termArray.includes(text.split(' ')[1])) {
        rfqObject.termPeriod = text.split(' ')[1];
        rfqObject.loanTerm = parseInt(text.split(' ')[0]);
        sendRFQ(sender);
        continue;
      }
  	    sendTextMessage(sender, `Text received, echo: ${text.substring(0, 200)}`);
    }
    if (event.postback) {
      const text = JSON.stringify(event.postback);
      const parsedTextObject = JSON.parse(text);
      if (parsedTextObject.payload === 'How Much Would You Like?') {
        askHowMuch(sender);
        continue;
      }
      if (parsedTextObject.payload === 'RFQS GET') {
        getRFQS(sender);
        continue;
	  }
	  if (parsedTextObject.payload.includes('RFQ:')) {
    	console.log('OOLOLOLOLOLOLOLOLOLOLOLOLOLOLOL');
  	    sendTextMessage(sender, 'Message Received', token);
  	    continue;
	  }
      console.log('}{}{}{}{}{}{}{}{}{}{}{}{}{}{', text);
  	    sendTextMessage(sender, `Postback received: ${text.substring(0, 200)}`, token);
  	    continue;
    }
  }
  res.sendStatus(200);
});

const token = process.env.PAGE_ACCESS_TOKEN;

function sendTextMessage(sender, text) {
  const messageData = { text };
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

function sendGenericMessage(sender) {
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
            payload: 'How Much Would You Like?'
				          },
				          {
				            type: 'postback',
				            title: 'See Loan Requests',
				            payload: 'RFQS GET'
				          }
				        ]
				      }
				    }
  };
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


function askHowMuch(sender) {
  const messageData = {
    text: 'How Much Would You Like A Loan For?'
  };
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

function askForHowLong(sender) {
  const messageData = {
    text: 'For How Long?'
  };
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

function sendRFQ(sender) {
  console.log('+_+_+_+_+_+_+_+_+_+_+_+_+_+__+_+_+_+_+_+_+_+_+_++_+_+_+_', rfqObject);

  const params = {
    headers: { 'x-spoke-client': process.env.CLIENT_TOKEN },
    uri: 'https://zqi6r2rf99.execute-api.eu-west-1.amazonaws.com/testing/rfqs',
    method: 'POST',
    body: rfqObject,
    json: true
  };

  return rp(params)
    .then((result) => {
      const messageData = {
        text: 'Your loan request has been sent!'
      };
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
  const parsedResult = JSON.parse(results);
  const rfqsArray = parsedResult.rfqs;
  const requiredInformation = rfqsArray.map(rfq => ({
		  amount: rfq.payload.loanAmount,
		  term: `${rfq.payload.loanTerm} ${rfq.payload.termPeriod}`,
		  rfqNumber: rfq.rfqNumber,
		  created: rfq.createdTimeStamp
	  }));

  const listTemplate = requiredInformation.map(rfqData => ({
    title: `Your Loan Request for £${rfqData.amount}`,
    subtitle: `Created ${ta.ago(rfqData.created)}`,
    buttons: [
      {
        type: 'postback',
        title: `Your Loan for ${rfqData.amount} over ${rfqData.term} created on ${rfqData.created}`,
        payload: `RFQ: ${rfqData.rfqNumber}`
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
});
}
