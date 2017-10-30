// var http = require('http');

// http.createServer(function (req, res) {
    
//     res.writeHead(200, { 'Content-Type': 'text/html' });
//     res.end('Hello, world!');
    
// }).listen(process.env.PORT || 8080);

var moment = require('moment')
var time = moment()
var express = require('express')
var bodyParser = require('body-parser')
var request = require('request')
var app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

app.get('/', function (req, res) {
    res.send('This is my bot: ' + time.format('YYYY-MM-DD HH:mm:ss Z'));
});

app.listen((process.env.PORT || 8080));

// Connect to GYANT at https://api-mbf.dev.gyantts.com:3978/api/testing

// request(
//     {
// 	url: 'https://api-mbf.dev.gyantts.com:3978/api/testing',
// 	method: 'POST',
// 	json: {
// 	    type: 'message',
// 	    timestamp: ,
// 	    text: "Hello",
// 	    address:
// 	    {
// 		serviceUrl: 'https://gyantchatbot.azurewebsites.net',
// 		type: 'direct'
// 	    },
// 	    user:
// 	    {
// 		id: 'kiwi',
// 		name: 'Kiwi'
// 	    },
// 	    source: 'testing',
// 	    token: 'michael-VkZRbWhOUTF'
// 	}
//     },
//     function (error, response, body)
//     {
// 	if (error)
// 	{
// 	    console.log('Error sending message: ', error); 
//         } else if (response.body.error) { 
//             console.log('Error: ', response.body.error); 
//         } 
//     }
// );

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

// app.get('/webhook', function (req, res) {
//     if (req.query['hub.verify_token'] === 'gyantchatbot_verify_token')
//     {
// 	res.status(200).send(req.query['hub.challenge']);
//     }
//     else
//     {
// 	res.status(403).send('Invalid verify token');
//     }
// });

