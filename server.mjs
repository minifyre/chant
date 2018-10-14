import ws from 'ws'
const {assign,entries}=Object
export default function chant(server,state,updater)
{
	let counter=0
	const
	cons={},
	wss=new ws.Server({server})

	wss.on('connection',function(con)//@todo add authentication & allowed origins
	{
		const from=con.id=counter+=1
		cons[from]=con
		con.on('message',msg=>updater(assign(JSON.parse(msg),{from})))
		//@todo need a way to determine if connection is lost
		con.on('close',()=>delete cons[from])
		con.send(JSON.stringify({type:'set',path:[],value:state}))
	})

	return function(act,msg=JSON.stringify(act))
	{
		entries(cons).forEach(([id,con])=>id!==act.from&&con.send(msg))
	}
}