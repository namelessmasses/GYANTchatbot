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

var g_userContexts = new Map();

function UserContext(userid, res)
{
    this.userid = userid;
    this.res = res;

    this.display = function (user, text)
    {
	this.res.write(ts_fmt(`[${user}]: ${text}\n`));
    }

    this.end = function ()
    {
	this.res.end();
	return true;
    }

    this.sendTextToGYANT = function (text, display)
    {
    	display = typeof display !== 'undefined' ? display : true;
    	
    	console.log(ts_fmt(`(sendTextToGYANT) userid=[${this.userid}] sending [${text}]`));
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
        			id: this.userid,
        			name: this.userid
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

    	if (display)
    	{
    	    this.display(this.userid, text);
    	}
    };

    // \todo Store content and handlers separate from code and load at
    // startup. Perhaps just map /regex/ with text with which to reply?
    // 
    this.contentHandlers = [];

    function addContentRule(collection, matchFunction, resultFunction)
    {
        collection.push([matchFunction, resultFunction]);
    }

    this.findContentHandler = function (s)
    {
    	for (const [predicate, handler] of this.contentHandlers)
    	{
    	    if (predicate(s))
    	    {
        	return handler;
    	    }
    	}
    
    	return null;
    };

    function create_regex_test_predicate(exprString)
    {
	var regex = new RegExp(exprString);
	return regex.test.bind(regex);
    }

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('how old are you in human years'),
		   this.sendTextToGYANT.bind(this, '42 years old'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('All clear'),
		   this.sendTextToGYANT.bind(this, 'yes'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('where do you live'),
		   this.sendTextToGYANT.bind(this, 'San Francisco'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('What\'s your height in feet'),
		   this.sendTextToGYANT.bind(this, '5\'10"'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('your weight in pounds'),
		   this.sendTextToGYANT.bind(this, '150'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('Which countries have you traveled to'),
		   this.sendTextToGYANT.bind(this, 'England'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('Please describe your symptoms for me'),
		   this.sendTextToGYANT.bind(this, 'My hands hurt'));

    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('From your symptom description, the best match in my database is'),
		   this.end.bind(this));
    
    addContentRule(this.contentHandlers,
		   create_regex_test_predicate('Consulting my database now about your answers'),
		   this.end.bind(this));

    this.text = function (msg)
    {
    	this.display('GYANT', msg.content);
    	
    	var contentHandler = this.findContentHandler(msg.content);
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
    	return false;
    };

    this.quickResponses = function (msg)
    {
    	this.display('GYANT', msg.headerText);
    	console.log(ts_fmt('(handleQuickResponses) msg.headerText= ' + msg.headerText));
    	console.log(ts_fmt('(handleQuickResponses) msg.responses='));
    	for (var i in msg.responses)
    	{
    	    this.display('GYANT', msg.responses[i].content);
    	    
    	    console.log(ts_fmt(`(handleQuickResponses) msg.responses[${i}] =`));
    	    console.log(msg.responses[i]);
    	}
    
    	// Randomly choose a quick response.
    	// Random number in the range [0, msg.responses.length - 1]
    	var randomIndex = Math.trunc(Math.random() * msg.responses.length);
    	console.log(ts_fmt(`(handleQuickResponses) randomly choose ${randomIndex}`));
    
    	var randomResponse = msg.responses[randomIndex];
    	console.log(ts_fmt('(handleQuickResponses) response='));
    	console.log(randomResponse);
    
    	this.display(this.userid, randomResponse.content);
    	this.sendTextToGYANT(randomResponse.responseContext, false);
    	return true;
    };

    /// Finds a method on the UserContext of the same name as the
    /// message type. If such a method exists executes the method
    /// passing the message.
    this.handleMessage = function (message)
    {
    	// Delegate the handler for this message type. If no
    	// handler is present log an error and continue.
    	if (this.hasOwnProperty(message.type))
    	{
    	    var messageHandler = this[message.type];
    	    if (messageHandler)
    	    {
    		    return messageHandler.call(this, message);
    	    }
    	}
    	else
    	{
    	    // Message is of an unknown type
    	    //
    	    // \todo better handle error condition: unknown message
    	    // type
    	    console.info(ts_fmt(`(handleMessage) INFO: Unknown message type [${message.type}]`));
    	    return false;
    	}
    };
}

// Check for an existing userContext and create one if not present for
// this user. If an existing UserContext is present then use the new
// response object from this point forward.
function sendTextForUser(res, userid, textToSend)
{
    var userContext = g_userContexts.get(userid);
    if (!userContext)
    {
    	userContext = new UserContext(userid, res);
    	g_userContexts.set(userid, userContext);
    }
    else
    {
    	userContext.res = res;
    }
    userContext.sendTextToGYANT(textToSend);
}

// The root route chooses a default user ID based on YYYYMMDD-hhmmss and text to
// send 'Hello'. 
app.get('/',
	function (req, res)
	{
	    res.setHeader('Content-Type', 'text/plain');

	    var time = moment();
	    var userid = time.format('YYYYMMDD-hhmmss');
	    console.log(ts_fmt(`(/) userid=[${userid}]`));

	    var textToSend = 'Hello';
	    console.log(ts_fmt(`(/) textToSend=[${textToSend}]`));
	    
	    sendTextForUser(res, userid, textToSend);
	}
);

// This route allows sending arbitrary text for an arbitrary user ID.
app.get('/userid/:userid/text/:text',
	function (req, res)
	{
	    res.setHeader('Content-Type', 'text/plain');
	    
	    // Extract a userid and text to send to GYANT
	    var userid = req.params.userid;
	    if (!userid)
	    {
    		userid = 'kiwi';
	    }
	    console.log(ts_fmt(`(/userid/:userid/text/:text) userid= ${userid}`));

	    var  textToSend = req.params.text;
	    if (!textToSend)
	    {
	    	textToSend = 'Hello';
	    }
	    console.log(ts_fmt(`(/userid/:userid/text/:text) textToSend= ${textToSend}`));

	    sendTextForUser(res, userid, textToSend);
	}
);

app.post('/inbound',
	 function (req, res)
	 {
	     var time = moment();
	     console.log(ts_fmt('(/inbound): BODY'));
	     console.log(req.body);

	     // Find the context for this user.
	     var userContext = g_userContexts.get(req.body.user.name);
	     if (!userContext)
	     {
    		 console.error(ts_fmt(`(/inbound): ERROR - Cannot find user context for username ${req.body.user.name}`));
    		 return;
	     }

	     for (var i in req.body.message)
	     {
    		 var message = req.body.message[i];
    		 if (userContext.handleMessage(message))
    		 {
    		     break;
    		 }
	     }
	 }
);

app.listen((process.env.PORT || 8080));

