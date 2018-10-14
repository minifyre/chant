import ws from 'ws'
const {assign,entries}=Object
export default function chant(server,state,updater)
{
	const
	cons={},
	wss=new ws.Server({server})

	wss.on('connection',function(con)//@todo add authentication & allowed origins
	{
		console.log(con.id)
		//@todo use an id as one device could have multiple connections open
		const from=''
		cons[from]=con
		con.on('message',msg=>updater(assign(JSON.parse(msg),{from})))
		//@todo need a way to determine if connection is lost
		con.on('close',function(ws)
		{
			delete cons[from]
		})
		con.send(JSON.stringify({type:'set',path:[],value:state}))
	})

	return function forward(act)
	{
		const msg=JSON.stringify(act)

		entries(cons).forEach(([id,con])=>id!==act.from&&con.send(msg))
	}
}