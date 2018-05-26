'use strict';
const chant=function(json={})
{
	let handlers=[];
	const
	self={},
	input={},
	sockets={},
	deviceId=logic.id(),
	state=logic.clone(json),
	defHandler={func:x=>x,path:'',type:''};
	input.msg=function(evt)
	{
		const {device,type,path,val}=JSON.parse(evt.data);
		type==='set'?self.set(path,val,device):
		type==='delete'?self.delete(path,device):
		console.error(type+' is not a valid type');
	};
	self.delete=function(path='',device=deviceId)
	{
		let [ref,prop]=logic.getRefParts(state,path);
		delete ref[prop];
		return self.emit({'type':'delete',path,device});
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
		{clone,path2props,traverse}=logic,
		props=path2props(path);
		return clone(props.reduce(traverse,state));
	};
	self.off=function(handler)
	{
		const query=Object.assign({},defHandler,handler);
		handlers=handlers.filter(function(result)
		{
			return !Object.keys(query)
			.some(prop=>query[prop].toString()===result[prop].toString());
		});
		return self;
	};
	self.on=function(handler)//={path:property-path,type:action,func:callback}
	{
		handlers.push(Object.assign({},defHandler,handler));
		return self;
	};
	self.set=function(path='',val=undefined,device=deviceId)
	{
		let [ref,prop]=logic.getRefParts(state,path);
		ref[prop]=val;
		return self.emit({type:'set',path,val,device});
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(logic.clone(init));
		return self.set(path,val);
	};
	self.with=function(address=location.href.split('/')[2])//[protocol,_,addr]
	{
		//setup socket
		const socket=sockets[address]=new WebSocket('ws://'+address,'echo-protocol');
		//setup state listener
		self.on({path:'public',func:function(action)//{type,path,val}
		{
			//don't send duplicate actions back that originated from the server
			if (action.device===deviceId)
			{
				socket.send(JSON.stringify(action));//@todo centeralize msg passing
			}
		}});
		//setup server connection
		socket.addEventListener('open',function(evt)
		{
			const setup=function(evt)
			{
				input.msg(evt);//sync inital server data with client
				self.set('private.id',deviceId);
				self.set('public.devices.'+deviceId,{});
				socket.removeEventListener('message',setup);
				//listen for stuff from server & sync state on message
				socket.addEventListener('message',input.msg);
			};
			//@todo centeralize msg passing
			socket.send(JSON.stringify({type:'get',path:'public',device:deviceId}));
			//@todo on close,queue up all emitted events & send the all when connection is re-established?
			socket.addEventListener('message',setup);//temp func for initial setup
		});
		return self;
	};
	return self;
},
logic=
{
	arrSplit:(arr=[],i=arr.length)=>[arr.slice(0,i),arr.slice(i)],
	clone:json=>JSON.parse(JSON.stringify(json)),
	path2props:path=>path.split('.').filter(txt=>txt.length),
	traverse:(obj,prop)=>obj[prop]
};
logic.getRef=function(ref={},props=[])
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
logic.getRefParts=function(json={},path='')
{
	let
	{arrSplit,getRef,path2props}=logic,
	props=path2props(path),
	[firstProps,lastProp]=arrSplit(props,props.length-1),
	ref=getRef(json,firstProps);
	return [ref,lastProp];//must be sent sepearately as lastProp will mutate
};
logic.id=function()//uuidv4
{
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=>
	(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));
};
export {chant};