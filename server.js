var moment = require('moment')
var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

function talkToGYANT(output)
{
    var time = moment();
    request(
	{
	    url: 'https://api-mbf.dev.gyantts.com:3978/api/testing',
	    method: 'POST',
	    json: {
		type: 'message',
		timestamp: time.format('YYYY-MM-DD HH:mm:ss Z'),
		text: "Hello",
		address:
		{
		    serviceUrl: 'https://gyantchatbot.azurewebsites.net',
		    type: 'direct'
		},
		user:
		{
		    id: 'kiwi',
		    name: 'Kiwi'
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
		output.send(time.format('YYYY-MM-DD HH:mm:ss Z')
			    + ': '
			    + '\t response= ' + response + '\n'
			    + '\t response.statusCode= ' + response.statusCode
			    + '\t response.statusMessage= ' + response.statusMessage
			    + '\t response.headers= ' + response.headers
			    + '\t body= ' + body);
	    }
	}
    ).on('data',
	 function (data)
	 {
	     var time = moment();
	     console.log(time.format('YYYY-MM-DD HH:mm:ss Z') + ': '
			 + data);
	 }
	);
}

app.get('/',
	function (req, res)
	{
	    var time = moment();
	    talkToGYANT(res);
	}
       );

app.post('/webhook',
	 function (req, res)
	 {
	     console.log('/webhook= req=${req} res=${res}')
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

