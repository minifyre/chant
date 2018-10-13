import websocket from './node_modules/websocket/index.js'
import truth from './node_modules/truth/index.mjs'

export default async function chant(state,httpServer)
{
	const
	cons={},
	{state:write}=truth(state,chant.forward),
	server=websocket.server({autoAcceptConnections:false,httpServer})

	return server.on('request',evt=>chant.req(evt,cons,write))
}
//@todo Make sure to only accept requests from an allowed origin
chant.auth=async req=>true
//@todo forward actions to other clients?
chant.disconnect=(from,cons)=>delete cons[from]
chant.forward=function(act,cons)//@todo handle get requests
{
	const msg=JSON.stringify(act)

	Object
	.entries(cons)
	.filter(([id])=>id!==act.from)
	.forEach(([_,con])=>chant.send(con,msg))
}
chant.msg=function(evt,state)
{
	if (evt.type!=='utf8') return//@todo +type==='binary' & msg.binaryData

	const act=JSON.parse(evt.utf8Data)

	if(act.type==='get'&&!act.path.length)
	{
		cons[from]=con
		con.on('close',chant.disconect(from))
		chant.send(con,{from,path,type:'set',val:self[type](path)})
	}
	else truth.inject(state,act)
}
chant.req=async function({accept,origin,reject},cons,state)
{
	if(await chant.auth(evt)) return reject()
	const con=cons[origin]=accept('echo-protocol',origin)
	con.on('message',evt=>chant.msg(evt,state))
}
chant.send=(con,msg)=>con.sendUTF(JSON.stringify(msg))