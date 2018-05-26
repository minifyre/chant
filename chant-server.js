'use strict';
const
//modules
crypto=require('crypto'),
wsServer=require('websocket').server;
async function init(httpServer,initalState={})
{
	const chant=await import('./chant.mjs');
	const
	self=chant.chant(initalState),
	server=new wsServer({autoAcceptConnections:false,httpServer});
	self.auth=req=>new Promise((pass,fail)=>pass());//customizable, promise-based auth
	//needs to be reset up to use node js's crypto lib
	self.id=function()//uuidv4 (node.js adaptation)
	{		
		return ([1e7]+-1e3+-4e3+-8e3+-1e11)
		.replace(/[018]/g,c=>(c^crypto.randomBytes(1)[0]&15>>c/4).toString(16));
	};
	server.on('request',function(req)
	{
		self.auth(req)
		.then(function()
		{
			var connection=req.accept('echo-protocol',req.origin);
			console.log((new Date())+' Connection accepted.');
			connection.on('message',function(msg)
			{
				if (msg.type==='utf8')
				{
					const
					defaults={type:'',path:'',val:''},
					obj=JSON.parse(msg.utf8Data),
					{type,path,val,id}=Object.assign(defaults,obj);
					if (type==='set')
					{
						self[type](path,val);
						//@todo send this action to all clients except the one it came from
					}
					//@todo +delete
					else if (type==='get')
					{
						//@todo centeralize msg creation to always use an id
						connection.sendUTF(JSON.stringify({type:'set',path,val:self[type](path),id:self.id()}));
					}
					else
					{
						connection.sendUTF('{"error":"'+type+' is not a valid type"}');
					}
					console.log('msg handled');
				}
				/*else if (msg.type==='binary')
				{
					console.log('Received Binary Message of '+msg.binaryData.length+' bytes');
					connection.sendBytes(msg.binaryData);
				}*/
			});
			connection.on('close',function(reasonCode,desc)
			{
				console.log((new Date())+' Peer '+connection.remoteAddress+' disconnected.');
			});
		})
		.catch(function(err)
		{
			// Make sure we only accept requests from an allowed origin
			req.reject();
			console.log((new Date())+' Connection from origin '+req.origin+' rejected.');
			return;
		})
	});
	return new Promise(function(pass,fail)
	{
		pass(self);
	});
};
module.exports=init;