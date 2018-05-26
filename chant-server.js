'use strict';
const
//modules
crypto=require('crypto'),
wsServer=require('websocket').server,
//util
input={},
logic={};
input.disconnect=function(reasonCode,desc)
{
};
input.msgUTF8=function(msg)
{
	if (msg.type==='utf8')
	{
		const
		defaults={type:'',path:'',val:''},
		obj=JSON.parse(msg.utf8Data),
		{type,path,val,id}=Object.assign(defaults,obj);
		if (type==='set')
		{
			self.set(path,val);
			//@todo forward action to all clients except the one it came from
				//(add event listener & and a from:clientid prop to msg?)
		}
		else if (type==='delete')
		{
			self.delete(path);
			//@todo forward action to all clients except the one it came from
				//(add event listener & and a from:clientid prop to msg?)
		}
		else if (type==='get')
		{
			//@todo centeralize msg creation to always use an id
			connection.sendUTF(JSON.stringify(
			{
				type:'set',
				path,
				val:self[type](path),
				id:self.id()
			}));
		}
		else
		{
			connection.sendUTF('{"error":"'+type+' is not a valid type"}');
		}
	}
	//@todo +msg.type==='binary' & msg.binaryData
};
logic.auth=req=>new Promise((pass,fail)=>pass(req));//customizable, promise-based auth
logic.id=function()//uuidv4 (node.js adaptation compatible with the crypto module)
{		
	return ([1e7]+-1e3+-4e3+-8e3+-1e11)
	.replace(/[018]/g,c=>(c^crypto.randomBytes(1)[0]&15>>c/4).toString(16));
};
async function chant(httpServer,initalState={})
{
	const chant=await import('./chant.mjs');
	const
	self=Object.assign(chant.chant(initalState),logic),
	server=new wsServer({autoAcceptConnections:false,httpServer});
	server.on('request',function(req)
	{
		self.auth(req)
		.then(function()
		{
			var connection=req.accept('echo-protocol',req.origin);
			connection.on('message',input.msgUTF8);
			connection.on('close',input.disconnect);
		})
		.catch(function(err)
		{
			// Make sure we only accept requests from an allowed origin
			req.reject();
			return;
		});
	});
	return new Promise((pass,fail)=>pass(self));
}
module.exports=chant;