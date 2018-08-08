'use strict';
const
//modules
crypto=require('crypto'),
importHack=require('./importHack.js'),
wsServer=require('websocket').server,
//silo
cache={connections:{}},
input={},
logic={},
output={};
logic.auth=req=>new Promise((pass,fail)=>pass(req));//customizable, promise-based auth
output.forwardAction=function(action)
{
	const
	{connections}=cache,
	{device:from}=action,
	msg=JSON.stringify(action);
	Object.keys(connections)//@todo may need to improve perf here
	.filter(id=>id!==from)
	.map(id=>cache.connections[id])
	.forEach(connection=>connection.sendUTF(msg));
};
function chant(httpServer,initalState={},opts={})//@todo integrate opts
{
	return importHack('../node_modules/chant/')
	.then(function(imports)
	{
		const {chant,util}=imports;
		util.rand=()=>crypto.randomBytes(1);//node crypto differs from browser crypto
		const
		defaults={id:util.id(),separator:'.'},
		self=chant(initalState,Object.assign(defaults,opts)),
		server=new wsServer({autoAcceptConnections:false,httpServer});
		self.auth=logic.auth;
		self.id=util.id;
		output.disconnector=function(connectionId)
		{
			return function(reasonCode,desc)
			{
				delete cache.connections[connectionId];
				//@todo delete associated tabs
				console.clear();
				console.log(JSON.stringify(self.delete('public.devices.'+connectionId).get(),null,4));
			};
		};
		server.on('request',function(req)
		{
			self.auth(req)
			.then(function()
			{
				var connection=req.accept('echo-protocol',req.origin);
				connection.on('message',function(msg)
				{
					if (msg.type==='utf8')
					{
						const
						defaults={type:'',path:'',val:''},
						obj=JSON.parse(msg.utf8Data),
						{type,path,val,device}=Object.assign(defaults,obj);
						if (type==='set')
						{
							self.set(path,val);
							output.forwardAction(obj);//@todo (+evt listener & and a from:clientid prop to msg?)
							//@todo +self.on({func:output.forwardAction})
						}
						else if (type==='delete')
						{
							self.delete(path);
							output.forwardAction(obj);//@todo (+evt listener & and a from:clientid prop to msg?)
						}
						else if (type==='get')
						{
							cache.connections[device]=connection;
							connection.on('close',output.disconnector(device));
							connection.sendUTF(JSON.stringify(
							{
								type:'set',
								path,
								val:self[type](path),
								device:''
							}));
						}
						else
						{
							connection.sendUTF('{"error":"'+type+' is not a valid type"}');
						}
					}
					//@todo +msg.type==='binary' & msg.binaryData
					console.clear();
					console.log(JSON.stringify(self.get(),null,4));
				});
			})
			.catch(function(err)
			{
				// Make sure we only accept requests from an allowed origin
				req.reject();
				return;
			});
		});
		return self;
	});
}
module.exports=chant;