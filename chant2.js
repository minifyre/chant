'use strict';
import {util} from './chant.util.js';
const
input={},
logic={},
output={};
output.listener=util.mk({func:x=>x,path:[],type:''});
const chant2=function(json={},opts={})
{
	let handlers=[];
	const
	sockets={},//this can be used to sync with multiple clients (aka multiplayer games with identical installations of the program)
	state=util.clone(json),
	{id:deviceId}=Object.assign({id:util.id()},opts),
	//clone makes edits to the original not change the
	//proxy's underlying value & thus prevents distortion
	handler=function(path=[])
	{
		const
		deleteProperty=function(obj,prop)
		{
			delete obj[prop];
			emit({'type':'delete',path,device});
			return new Proxy(obj,output.handler([...path,prop]));
		},
		get=function(obj,prop)
		{
			return proxyWrapper(obj,[...path,prop]);
		},
		set=function(obj,prop,val)
		{
			obj[prop]=val;
			emit({type:'set',path,val,device})
			return proxyWrapper(obj,[...path,prop]);
		};
		return {deleteProperty,get,set};
	},
	proxy=new Proxy(util.clone(state),handler()),
	emit=function(action)
	{
		console.log(action);
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
	},
	acceptMsg=function(evt)
	{
		const {device,type,path,val}=JSON.parse(evt.data);
		if (type==='set')
		{
			const
			[last,...base]=path.slice().reverse(),
			ref=util.getRef(proxy,base);
			ref[last]=val;//@todo see if using pure state & manually triggering emit is faster
		}
		else if (type==='delete')
		{
			const
			[last,...base]=path.slice().reverse(),
			ref=util.getRef(proxy,base);
			delete ref[last];//@todo see if using pure state & manually triggering emit is faster
		}
		else
		{
			console.error(type+' is not a valid type');
		}
	},
	proxyWrapper=function(obj,path)
	{
		const prop=path[path.length-1];
		return 	typeof obj[prop]==='object'&&obj[prop]!==null?
				new Proxy(obj[prop],handler(path)):
				obj[prop];
	};
	//@todo these intere with toJSON requests & remove properties
	proxy.on=function(handler)
	{
		handlers.push(output.listener(handler));
	};
	proxy.off=function(handler)
	{
		const query=output.listener(handler);
		handlers=handlers.filter(function(result)
		{
			return !Object.keys(query)
			.every(prop=>query[prop].toString()===result[prop].toString());
		});
	};
	proxy.with=function(address=location.href.split('/')[2])//[protocol,_,addr]
	{
		//setup socket
		const socket=sockets[address]=new WebSocket('ws://'+address,'echo-protocol');
		//setup state listener
		proxy.on({path:'public',type:'set',func:function(action)//{type,path,val}
		{
			//don't send duplicate actions back that originated from the server
			if (action.device===deviceId)
			{
				socket.send(JSON.stringify(action));//@todo centeralize msg passing
			}
		}});
		return new Promise(function(pass,fail)
		{
			//setup server connection
			socket.addEventListener('open',function(evt)
			{
				const setup=function(evt)
				{
					acceptMsg(evt);//sync inital server data with client
					state.private.id=deviceId;
					state.public.devices[deviceId]={};
					socket.removeEventListener('message',setup);
					//listen for stuff from server & sync state on message
					socket.addEventListener('message',acceptMsg);
					pass(proxy);
				};
				//@todo centeralize msg passing
				socket.send(JSON.stringify({type:'get',path:'public',device:deviceId}));
				//@todo on close,queue up all emitted events & send the all when connection is re-established?
				socket.addEventListener('message',setup);//temp func for initial setup
			});
		});
	};
	return proxy;
};
export {chant2};