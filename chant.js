'use strict';
const chant=function(json={})
{
	let handlers=[];
	const
	self={},
	sockets={},
	receivedEvts=[],
	state=util.clone(json),
	defHandler={func:x=>x,path:'',type:''};
	self.delete=function(path='')
	{
		let [ref,prop]=util.getRefParts(state,path);
		delete ref[prop];
		return self.emit({'type':'delete',path,id:util.id()});
	};
	self.emit=function(action)
	{
		action=Object.assign({timestamp:Date.now()},action);
		handlers.forEach(function(obj)
		{
			const {path,type,func}=obj;
			if (action.path.match(path)&&
			    action.type.match(type))
			{
				func(action);
			}
		});
		return self;
	};
	self.get=function(path='')
	{
		const
		{clone,path2props,traverse}=util,
		props=path2props(path);
		return clone(props.reduce(traverse,state));
	};
	self.off=function(handler)
	{
		const query=Object.assign({timestamp:Date.now()},defHandler,handler);
		handlers=handlers.filter(function(result)
		{
			return !Object.keys(query)
			.some(prop=>query[prop].toString()===result[prop].toString());
		});
		return self;
	};
	self.on=function(handler)//={path:property-path,type:action,func:callback}
	{
		handlers.push(Object.assign({timestamp:Date.now()},defHandler,handler));
		return self;
	};
	self.set=function(path='',val=undefined)
	{
		let [ref,prop]=util.getRefParts(state,path);
		ref[prop]=val;
		return self.emit({type:'set',path,val,id:util.id()});
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(util.clone(init));
		return self.set(path,val);
	};
	//client code
	self.with=function(address=location.href.split('/')[2])//[protocol,_,addr]
	{
		//setup socket
		const socket=sockets[address]=new WebSocket('ws://'+address);
		//setup state listener
		self.on({func:function(action)//{type,path,val}
		{
			//don't send duplicate actions back that originated from the server
			if (receivedEvts.every(id=>id!==action.id))
			{
				socket.send(JSON.stringify(action));
			}
		}});
		//setup server connection
		socket.addEventListener('open',function(evt)
		{
			socket.send({});//@todo send UUID for client
			//@todo on close,queue up all emitted events & send the all when connection is re-established
		});
		//listen for stuff from server & sync state on message
		socket.addEventListener('message',function(evt)
		{
			const {id,type,path,val}=JSON.parse(evt.data);
			receivedEvts.push(id);//make sure not to send this action back to server
			self[type](path,val);
			console.log('msg received',evt.data);
		});
		return self;
	};
	//server code
	self.server=function(httpServer)
	{
		const
		wsServer=require('websocket').server,
		server=new wsServer({autoAcceptConnections:false,httpServer}),
		originIsAllowed=origin=>true;//@todo +auth logic
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
	};
	return self;
},
util=
{
	arrSplit:(arr=[],i=arr.length)=>[arr.slice(0,i),arr.slice(i)],
	clone:json=>JSON.parse(JSON.stringify(json)),
	path2props:path=>path.split('.').filter(txt=>txt.length),
	traverse:(obj,prop)=>obj[prop]
};
util.getRef=function(ref={},props=[])
{
	for(let c=0,l=props.length;c<l;c++)//optimized for speed
	{
		let prop=props[c];
		if(!ref[prop])
		{
			ref[prop]={};
		}
		ref=ref[prop];
	}
	return ref;
};
util.getRefParts=function(json={},path='')
{
	let
	{arrSplit,getRef,path2props}=util,
	props=path2props(path),
	[firstProps,lastProp]=arrSplit(props,props.length-1),
	ref=getRef(json,firstProps);
	return [ref,lastProp];//must be sent sepearately as lastProp will mutate
};
util.id=function()//uuidv4
{
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
	(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
};
export {chant};