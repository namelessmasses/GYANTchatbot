'use strict';
var moment = require('moment');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

var TIME_FORMAT_STRING = 'YYYY-MM-DD HH:mm:ss Z';

function ts_fmt(s)
{
    var time = moment();
    return time.format(TIME_FORMAT_STRING) + ': ' + s;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// \todo Move to an object than maintains the user ID for different
// users
function sendTextToGYANT(userid, text)
{
    console.log(ts_fmt(`(sendTextToGYANT) sending [${text}]`));
    var time = moment();
    request(
	{
	    url: 'https://api-mbf.dev.gyantts.com:3978/api/testing',
	    method: 'POST',
	    json: {
		type: 'message',
		timestamp: time.format(TIME_FORMAT_STRING),
		text: text,
		address:
		{
		    serviceUrl: 'https://gyantchatbot.azurewebsites.net/inbound',
		    type: 'direct'
		},
		user:
		{
		    id: userid,
		    name: userid
		},
		source: 'testing',
		token: 'michael-VkZRbWhOUTF'
	    }
	},
	function (error, response, body)
	{
	    if (error)
	    {
		console.log('Error sending message: ', error); 
	    }
	    else
	    {
		console.log(ts_fmt('(sendTextToGYANT.response) '
				   + 'sent = [' + text + '] '
				   + 'response.statusCode= ' + response.statusCode + ' '
				   + 'response.statusMessage= ' + response.statusMessage));
	    }
	}
    );
}

// \todo Maintain a context for each 'user'

// \todo Maybe there is some part of this stored in the specific user
// context?
//

// \todo Store content and handlers separate from code and load at
// startup
// 
var g_contentHandlers = new Map();
g_contentHandlers.set('how old are you in human years?',
		      function ()
		      {
			  sendTextToGYANT('42 years old')
			  return true;
		      });
g_contentHandlers.set('And where do you live? (city and state)',
		      function ()
		      {
			  sendTextToGYANT('San Francisco');
			  return true;
		      });

function handleTextMessage(msg)
{
    var contentHandler = g_contentHandlers.get(msg.content);
    if (contentHandler)
    {
	return contentHandler();
    }

    // if no content handler is available for the input from GYANT
    // then log the content and allow processing of any
    // messages/responses/content that follows after this
    //
    console.log(ts_fmt('(handleTextMessage) INFO no handler for content - SKIPPING. msg.content='));
    console.log(msg.content);
    return true;
}

function handleQuickResponses(msg)
{
    console.log(ts_fmt('(handleQuickResponses) msg.headerText= ' + msg.headerText));
    console.log(ts_fmt('(handleQuickResponses) msg.responses='));
    for (var i in msg.responses)
    {
	console.log(ts_fmt(`(handleQuickResponses) msg.responses[${i}] =`));
	console.log(msg.responses[i]);
    }

    // Randomly choose a quick response.
    // Random number in the range [0, msg.responses.length - 1]
    var randomIndex = (Math.random() * msg.responses) - 1;
    console.log(ts_fmt(`(handleQuickResponses) randomly choose ${randomIndex}`));

    var randomResponse = msg.responses[i];
    console.log(ts_fmt('(handleQuickResponses) response='));
    console.log(randomResponse);

    
    sendTextToGYANT(msg.user.name, randomResponse.responseContext);
    return true;
}

var messageTypeHandler = new Map();
messageTypeHandler.set('text', handleTextMessage);
messageTypeHandler.set('quickResponses', handleQuickResponses);

app.get('/userid/:userid/text/:text',
	function (req, res)
	{
	    // Extract an userid and text to send to GYANT
	    //

	    var userid = req.params.userid
	    if (!userid)
	    {
		userid = 'kiwi';
	    }
	    console.log(ts_fmt(`(/) userid= ${userid}`));

	    var  textToSend = req.params.text;
	    if (!textToSend)
	    {
		textToSend = 'Hello';
	    }
	    console.log(ts_fmt(`(/) textToSend= ${textToSend}`));

	    // \todo Save a context for this user to be retrieved on
	    // /incoming. 

	    // Start by saying 'hello' to GYANT
	    res.send(ts_fmt(`Starting session to GYANT for userid=${userid}; sending ${textToSend}`));
	    sendTextToGYANT(userid, textToSend)
	}
       );

app.post('/inbound',
	 function (req, res)
	 {
	     // \todo Find the context for this user.

	     var time = moment();
	     console.log(ts_fmt('(/inbound): BODY'));
	     console.log(req.body);
	     for (var i in req.body.message)
	     {
		 var message = req.body.message[i];

		 // Delegate the handler for this message type. If no
		 // handler is present log an error and continue.
		 var messageHandler = messageTypeHandler.get(message.type)
		 if (messageHandler)
		 {
		     if (!messageHandler(message))
		     {
			 break;
		     }
		 }
		 else
		 {
		     // Message is of an unknown type
		     //
		     // \todo handle error condition: unknown message type
		     console.log(ts_fmt(`(/inbound) ERROR: Unknown message type ${message.type}`));
		 }
	     }
	 }
	);

app.listen((process.env.PORT || 8080));

// Connect to GYANT at https://api-mbf.dev.gyantts.com:3978/api/testing


// A typical message (from user) to GYANT is a JSON that looks like like this:
// {
//     type: 'message',
//     timestamp: “2017-06-01T22:32:09.507Z”,
//     text: “Hello”,
//     address: {
//       serviceUrl: <YOUR_BOT_URL>
//       type: “direct”,
//     },
//     user: {
//       id: “joel_temp_user_123456”,
//       name: “Bob”,
//     },
//     source: “testing”,
//     token: “michael-VkZRbWhOUTF”,
//   };

// (This corresponds to user typing “Hello” to the GYANT bot)

// A typical response from GYANT bot looks like this:
// { type: 'quickResponses',
//   headerText: 'My job is to help you identify any medical symptoms you might have and keep you healthy!',
//   responses:
//    [ { type: 'text',
//        content: 'Nice to meet you',
//        responseContext: 't_0161.1' },
//      { type: 'text',
//        content: 'So, you’re a bot?',
//        responseContext: 't_0162.2' } ] }

// FYI, the above will appear on Facebook messenger as a bubble with two buttons:

// If, in response to this message, the user presses “Nice to meet you” button, the message sent to GYANT (see code snippet #1) have text field set to “t_0161.1” (the responseContext code corresponding to “Nice to meet you”)


// Notes:
// Your bot needs to run on a box that will need to be accessible from the external Internet so that Connector can send messages to it (to the endpoint YOUR_BOT_URL in code snippet #1 above). We can set up a new AWS instance for you if you need one.
// Authentication: each message to GYANT must set the “token” field (see above). Your value for token must be michael-VkZRbWhOUTF.
// What your bot responds with is up to you. You will probably need to have a set of rules on how to answer different questions that the GYANT bot sends to you. What’s important is that you answer enough questions to reach a diagnosis (i.e. a message from GYANT that includes “The best match in my database is …”)
// There are different types of messages the GYANT bot can send to user: “quickResponses” (buttons), “text” (free text), and some others, which are not important for this exercise. An example of quickResponses message is shown above; “text” message look like this (notice that text is in “content” field, rather than “headerText”):
// { type: “text”, content: “You don’t look a day older than 746 in robot years” }
// The user id (message.user.id) field sent to the connector can be set to whatever you like (a unique id for each front-end client). You don’t have to worry about creating logins/password, you can just generate a random id on the client-side as the user id. Your implementation should work with multiple simultaneous clients though. message.user.name  can be set to whatever. 
// Please send us the code for your bot.

