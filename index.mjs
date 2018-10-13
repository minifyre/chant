import truth from './node_modules/truth/index.mjs'
export default function chant(state={},addr=chant.address())
{
	const
	socket=new WebSocket('ws://'+addr,'echo-protocol'),
	{addEventListener:on,removeEventListener:off,send}=socket,
	sync=x=>send(JSON.stringify(x))

	await new Promise(function(res,rej)
	{
		on('open',function connect()
		{
			off('open',connect)
			off('error',rej)
			on('error',console.error)
			on('message',function({data,origin:from})
			{
				truth.inject(state,Object.assign(JSON.parse(data),{from}))
			})
			sync({type:'get'})
			res()
		})
		on('error',rej)
	})

	return function(act)
	{
		if(act.from!==addr) sync(act)
		return act
	}
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]