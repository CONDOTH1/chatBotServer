'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
require('dotenv').config()

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send(res)
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === process.env.FACEBOOK_CHALLENGE) {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})

app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if (event.message && event.message.text) {
  	    let text = event.message.text
  	    if (text === 'Generic') {
  		    sendGenericMessage(sender)
  		    continue
				}
				if(text.includes('loan')){
					askHowMuch(sender)
					continue
				}
  	    sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
			}
      if (event.postback) {
				let text = JSON.stringify(event.postback)
				if(text === "How Much Would You Like?"){
					askHowMuch(sender)
					continue
				}
  	    sendTextMessage(sender, "Postback received: "+text.substring(0, 200), token)
  	    continue
      }
    }
    res.sendStatus(200)
})

const token = process.env.PAGE_ACCESS_TOKEN

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function sendGenericMessage(sender) {
    let messageData = {
	    "attachment": {
				"type":"template",
				      "payload":{
				        "template_type":"button",
				        "text":"What do you want to do next?",
				        "buttons":[
				          {
				            "type":"postback",
										"title":"Get A Loan",
										"payload": "How Much Would You Like?"
				          },
				          {
				            "type":"postback",
				            "title":"Start Chatting",
				            "payload":"USER_DEFINED_PAYLOAD"
				          }
				        ]
				      }
				    }
		}
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}


function askHowMuch(sender){
		let messageData = {
			text: "How Much Would You Like A Loan For?"
		}
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}
