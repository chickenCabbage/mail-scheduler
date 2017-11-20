require("dotenv").config({path: "../creds.env"}); //environment variables

var waitingForReply = false 		  ;
var pesters 		= 0 			  ; //mail count
var patienceTime	= process.argv[2] ; //the delay between each email
var senpai			= process.argv[3] ; //the person being pestered
var subject 		= process.argv[4] ; //the subject of the email
var file 			= process.argv[5] ; //the HTML for the message body

var sleep = require("system-sleep");
var fs = require("fs");

var nodemailer = require("nodemailer"); //SMTP API
function sendMail(recip, subject, content) {
	var mailOptions = {
		from 	: process.env.MAILER_USERNAME , //the sender
		to 		: recip 					  , //the recipient
		subject : subject 					  , //the mail subject
		html 	: content 						//the mail content
	};

	var transporter = nodemailer.createTransport({
		service    : process.env.MAILER_SERVICE  , //nodemailer recongnizes most email companies by their name
		auth: {
			"user" : process.env.MAILER_USERNAME , //login username
			"pass" : process.env.MAILER_PASSWORD   //login password
		}
	});
	transporter.sendMail(mailOptions, function(error, info){
		//if(error) throw error; //redundant, errors throw themselves
		console.log("Email successfully sent.");
		pesters ++;
	});
}//end sendMail()

console.log("SMTP prepared as " + process.env.MAILER_USERNAME + ".");

var MailListener = require("mail-listener2"); //IMAP API
var mailListener = new MailListener({
	username : process.env.EMAIL_LISTENER_USERNAME , //login username
	password : process.env.LISTENER_PASSWORD 	   , //login password
	host 	 : process.env.EMAIL_LISTENER_HOST 	   , //the IMAP host address
	port 	 : process.env.EMAIL_IMAP_PORT 		   , //IMAP port, usually not needed
	tls 	 : process.env.EMAIL_IMAP_TLS 		   , //allow TLS
	mailbox  : "INBOX" 							   , //if there are multiple inboxes, such as spam
	markSeen : false 								 //automatic "seen" marking on mail open
});

 mailListener.on("server:connected", function() { //when IMAP connects
	console.log("IMAP is ready as " + process.env.EMAIL_LISTENER_USERNAME + ".");
});
mailListener.on("server:disconnected", function() { //if IMAP disconnects
	console.log("Disconnected from email!");
	mailListener.stop() //officially stop

	if(waitingForReply) { 	  //just to make sure 
		mailListener.start(); //reconnect
		console.log("Restarted email connection.");
	}
});

mailListener.on("mail", function(mail, seqno, attributes) { //when an email has been recieved
	console.log("Mail recieved!");
	var addr = mail.from[0].address; //isolate the email address
	if(addr == senpai) {
		console.log("\nIt's senpai!\nPester count: " + pesters + "\n");
		process.exit(0);
	}
	else {
		var insults = [
			" but at least someone's talking to you"  ,
			" but at least you're popular" 			  ,
			" but hey, someone wanted to talk to you" ,
			", and you are so, so lonely."
		];
		console.log("It wasn't senpai" + insults[Math.floor(Math.random() * insults.length)]); // :^(
	}
});

async function timer() {
	while(true) {  						 //until process.exit(0)
		sleep(patienceTime * 60 * 1000); //minutes to milis
		sendMail(senpai, subject, fs.readFileSync(file));
		console.log("mail sent");
	}
} //end timer()

function start() {
	waitingForReply = true;
	mailListener.start();
	sendMail(senpai, subject, fs.readFileSync(file));
	console.log("mail sent");
	timer();
}

start();