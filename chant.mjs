'use strict';
import {util} from './chant.util.mjs';
const chant=function(json={},opts={})
{
	let handlers=[];
	const
	self={},
	sockets={},//can be used to sync with multiple clients (aka multiplayer games with identical installations of the program)
	state=util.clone(json),
	{id:deviceId}=Object.assign({id:util.id()},opts),
	acceptMsg=function(evt)
	{
		const {device,type,path,val}=JSON.parse(evt.data);
		type==='set'?self.set(path,val,device):
		type==='delete'?self.delete(path,device):
		console.error(type+' is not a valid type');
	};
	self.delete=function(path='',device=deviceId)
	{
		let [ref,prop]=util.getRefParts(state,path);
		delete ref[prop];
		return self.emit({type:'delete',path,device});
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
		return clone(props.reduce(traverse,state));//@todo use refs instead for perf?
	};
	self.off=function(handler)
	{
		const query=util.mkHandler(handler);
		handlers=handlers.filter(function(result)
		{
			return !Object.keys(query)
			.every(prop=>query[prop].toString()===result[prop].toString());
		});
		return self;
	};
	self.on=function(handler)//={path:property-path,type:action,func:callback}
	{
		handlers.push(util.mkHandler(handler));
		return self;
	};
	self.set=function(path='',val=undefined,device=deviceId)
	{
		let [ref,prop]=util.getRefParts(state,path);
		ref[prop]=val;
		return self.emit({type:'set',path,val,device});
	};
	self.update=function(path,func)
	{
		const
		init=self.get(path),
		val=func(util.clone(init));
		return self.set(path,val);
	};
	self.with=function(address=util.getAddress())
	{
		//setup socket
		const socket=sockets[address]=new WebSocket('ws://'+address,'echo-protocol');
		//setup state listener
		self.on({path:'public',type:'set',func:function(action)//{type,path,val}
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
					const name=util.getDeviceName();
					acceptMsg(evt);//sync inital server data with client
					self.set('private.id',deviceId);
					self.set('public.devices.'+deviceId,{id:deviceId,name});
					socket.removeEventListener('message',setup);
					//listen for stuff from server & sync state on message
					socket.addEventListener('message',acceptMsg);
					pass(self);
				};
				//@todo centeralize msg passing
				socket.send(JSON.stringify({type:'get',path:'public',device:deviceId}));
				//@todo on close,queue up all emitted events & send the all when connection is re-established?
				socket.addEventListener('message',setup);//temp func for initial setup
			});
		});
	};
	//array properties
	'every,find,findIndex,forEach,includes,indexOf,join,lastIndexOf,map,reduce,some'
	.split(',')
	.forEach(key=>self[key]=(path,...args)=>self.get(path)[key](...args));
	self.push=function(...args)
	{
		const
		[path,...vals]=args,
		prefix=(path||''),
		{length}=self.get(prefix);
		vals.forEach((val,i)=>self.set(prefix+'.'+(length+i),val));
		return length+vals.length;
	};
	self.pop=function(path='')
	{
		const {length}=self.get(path);
		self.delete(path+'.'+(length-1));
		return self;
	};
	//@todo add custom array props: splice
	//object properties
	'entries,keys,values'.split(',')
	.forEach(key=>self[key]=(path='')=>Object[key](self.get(path)));
	return Object.assign(self,{id:util.id});
};
export {chant};