require("dotenv").config({path: "../creds.env"});

var waitingForReply = false 		  ;
var pesters 		= 0 			  ;
var patienceTime	= process.argv[2] ;
var senpai			= process.argv[3] ;
var subject 		= process.argv[4] ;
var file 			= process.argv[5] ;

var sleep = require("system-sleep"); //for timing to help with the CPU load
var fs = require("fs");

var nodemailer = require("nodemailer");

function sendMail(recip, subject, content) {
	var mailOptions = {
		from 	: process.env.MAILER_USERNAME ,
		to 		: recip 					  ,
		subject : subject 					  ,
		html 	: content
	};

	var transporter = nodemailer.createTransport({
		service: process.env.MAILER_SERVICE,
		auth: {
			"user" : process.env.MAILER_USERNAME,
			"pass" : process.env.MAILER_PASSWORD
		}
	});
	transporter.sendMail(mailOptions, function(error, info){
		if(error) console.log("error in mailing!\n" + error);
	});
	pesters ++;
}//end sendMail()

console.log("SMTP prepared as " + process.env.MAILER_USERNAME + ".");

var MailListener = require("mail-listener2"); //email API
var mailListener = new MailListener({
	username : process.env.EMAIL_LISTENER_USERNAME ,
	password : process.env.LISTENER_PASSWORD 	   , //log in
	host 	 : process.env.EMAIL_LISTENER_HOST 	   ,
	port 	 : process.env.EMAIL_IMAP_PORT 		   ,
	tls 	 : process.env.EMAIL_IMAP_TLS 		   ,
	mailbox  : "INBOX" 							   ,
	markSeen : false
});

 mailListener.on("server:connected", function() {
	console.log("IMAP is ready as " + process.env.EMAIL_LISTENER_USERNAME + ".");
});
mailListener.on("server:disconnected", function() {
	console.log("Disconnected from email!");
	mailListener.stop()

	if(waitingForReply) {
		mailListener.start(); //reconnect
		console.log("Restarted email connection.");
	}
});

mailListener.on("mail", function(mail, seqno, attributes) {
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
		console.log("It wasn't senpai" + insults[Math.floor(Math.random() * insults.length)]);
	}
});

async function timer() {
	console.log("Timer has started.");
	while(true) {
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