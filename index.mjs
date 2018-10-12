import truth from './node_modules/truth/index.mjs'
export default function chant(state={},addr=chant.address())
{
	const
	socket=new WebSocket('ws://'+addr,'echo-protocol'),
	{addEventListener:on,removeEventListener:off,send}=socket

	await new Promise(function(res,rej)
	{
		on('open',function connect()
		{
			off('open',connect)
			off('error',rej)
			on('error',console.error)
			on('message',function evt2act({data,origin:from})
			{
				truth.inject(state,Object.assign(JSON.parse(data),{from}))
			})
			send(`{"type":"get"}`)
			res()
		})
		on('error',rej)
	})

	return function act2evt(act)
	{
		const {from,path,type,value}=act
		if(from===addr) return act
		send(JSON.stringify(act))
	}	
}
chant.address=(url=location.href)=>url.split('/')[2]//[protocol,_,address]