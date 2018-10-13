import websocket from './node_modules/websocket/index.js'
import truth from './node_modules/truth/index.mjs'

export default async function chant(state,httpServer)
{
	const
	connections={},
	write=truth(state,chant.forward),
	server=websocket.server({autoAcceptConnections:false,httpServer})

	return server.on('request',evt=>chant.req(evt,connections,write))
}
chant.req=async function({accept,origin,reject:rej},connections,state)
{
	const {err}=await chant.auth(evt)
	if(err) return rej()
	const con=connections[origin]=accept('echo-protocol',origin)
	con.on('message',evt=>chant.msg(evt,state))
}
//@todo Make sure to only accept requests from an allowed origin
chant.auth=async req=>true
//@tood forward actions to other clients?
chant.disconnect=(from,connections)=>delete connections[from]
chant.forward=function(act,cons)
{
	const msg=JSON.stringify(act)

	Object
	.entries(cons)
	.filter(([id])=>id!==act.from)
	.forEach(([_,con])=>con.sendUTF(msg))
}
chant.msg=function(evt,state)
{
	if (evt.type!=='utf8') return//@todo +type==='binary' & msg.binaryData

	const
	defaults={type:'',path:[],val:''},
	obj=JSON.parse(evt.utf8Data),
	{from,type,path,val}=Object.assign(defaults,obj),
	[props,props]=truth.zipList(path,path.length-1),
	ref=truth.ref(state,path)

	if (type==='set')
	{
		ref[prop]=val
		chant.forward(obj)//@todo (+evt listener & and a from:clientid prop to msg?)
		//@todo +self.on({func:chant.forward})
	}
	else if (type==='delete')
	{
		delete ref[prop]
		//@todo delete state.deveices[uuid or IP (multiple windows could equal multiple devices with identical IPS)]
		chant.forward(obj)//@todo (+evt listener & and a from:clientid prop to msg?)
	}
	else if (type==='get')
	{
		cons[from]=con
		con.on('close',chant.disconect(from))
		con.sendUTF(JSON.stringify({from,path,type:'set',val:self[type](path),}))
	}
	else con.sendUTF(`{"error":${type} is not a valid type"}`)
}