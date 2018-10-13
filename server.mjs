import websocket from './node_modules/websocket/index.js'
import truth from './node_modules/truth/index.mjs'

export default async function chant(state,httpServer)
{
	const
	connections={},
	write=truth(state,forwardActions)

	return websocket
	.server({autoAcceptConnections:false,httpServer})
	.on('request',evt=>chant.evt2act(evt,connections,write))
}


chant.evt2act=async function({accept,origin,reject:rej},cons,state)
{
	//@todo Make sure to only accept requests from an allowed origin
	const {err}=await chant.auth(evt)
	if(err) return rej()
	const con=cons[origin]=accept('echo-protocol',origin)
	con.on('message',evt=>chant.msg(evt,state))
}
chant.auth=async req=>true
chant.disconnect=function(from,cons)
{
	delete cons[from]
	//chant.forward({type:'del',path,device})
}
chant.forward=function(act,cons)
{
	const
	{from}=act,
	msg=JSON.stringify(act)
	Object.entries(cons)
	.forEach(([id,con])=>id!==from&&con.sendUTF(msg))
}
chant.msg=function(evt,state)
{
	if (evt.type==='utf8')
	{
		const
		defaults={type:'',path:'',val:''},
		obj=JSON.parse(evt.utf8Data),
		{type,path,val}=Object.assign(defaults,obj),
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
			cons[device]=con
			con.on('close',chant.disconect(device))
			con.sendUTF(JSON.stringify(
			{
				type:'set',
				path,
				val:self[type](path),
				device:''
			}))
		}
		else
		{
			con.sendUTF(`{"error":${type} is not a valid type"}`)
		}
	}
	//@todo +msg.type==='binary' & msg.binaryData
	chant.log(state)
}