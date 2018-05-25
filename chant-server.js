'use strict';
const wsServer=require('websocket').server;
async function init(httpServer,initalState={})
{
	const chant=await import('./chant.mjs');
	const
	self=chant.chant(initalState),
	server=new wsServer({autoAcceptConnections:false,httpServer}),
	originIsAllowed=origin=>true;//@todo +auth logic
	console.log(server);
	server.on('request',function(req)
	{
		if (!originIsAllowed(req.origin))
		{
			// Make sure we only accept requests from an allowed origin
			req.reject();
			console.log((new Date())+' Connection from origin '+req.origin+' rejected.');
			return;
		}
		var connection=req.accept('echo-protocol',req.origin);
		console.log((new Date())+' Connection accepted.');
		connection.on('message',function(msg)
		{
			if (msg.type==='utf8')
			{
				console.log('Received Message: '+msg.utf8Data);
				connection.sendUTF(msg.utf8Data);
			}
			else if (msg.type==='binary')
			{
				console.log('Received Binary Message of '+msg.binaryData.length+' bytes');
				connection.sendBytes(msg.binaryData);
			}
		});
		connection.on('close',function(reasonCode,desc)
		{
			console.log((new Date())+' Peer '+connection.remoteAddress+' disconnected.');
		});
	});
	return self;
};
module.exports=init;