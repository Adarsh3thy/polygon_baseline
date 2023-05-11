import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'
import { useRouter } from 'next/router';


import {
  marketplaceAddress
} from '../../config.js';

import NFTMarketplace from '../../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function EventDetails() {
  const [nfts, setNfts] = useState([])
  const [eventTickets, setEventTickets] = useState([]);
  const [loadingState, setLoadingState] = useState('not-loaded')

  const router = useRouter()
  const [eventId, setEventId] = useState(router.query.id)

  const [originalTixs, setOriginalTixs] = useState([]);
  const [resellTixs, setResellTixs] = useState([]);

  useEffect(()=>{
    if(!router.isReady) return;

    setEventId(router.query.id)
    loadNFTs()
  },[router.isReady])

  useEffect(() => {
    loadEventTickets();
  }, [nfts])


  async function loadNFTs() {
    
    const provider = new ethers.providers.JsonRpcProvider()
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider)
    const data = await contract.fetchMarketItems()
 
    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        eventId: i.eventId.toNumber(),
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner, 
        sold: i.sold,
        resold: i.isResold,
        date: meta.data.date,
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }));
    console.log("unsold items", items)
    setNfts(items);
  }

  async function loadEventTickets() {
    const ticketsByEventId = nfts.filter(ticket => ticket.eventId == Number(eventId));
    setEventTickets(ticketsByEventId);

    setOriginalTixs(ticketsByEventId.filter(item => item.resold == false));
    setResellTixs(ticketsByEventId.filter(item => item.resold == true));

    setLoadingState('loaded') ;  
  }

  async function buyNft(nft) {
    /* needs the user to sign the transaction, so will use Web3Provider and sign it */
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)

    /* user will be prompted to pay the asking proces to complete the transaction */
    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether')   
    console.log("Trying to buy", nft.tokenId,"at price", price)
    console.log("Current gas price", ethers.providers.getDefaultProvider())
    const transaction = await contract.createMarketSale(nft.tokenId, {
      value: price,
      gasLimit: 10000000
    })
    await transaction.wait()
    loadNFTs()
  }
  
  return (
    <div>
      {(loadingState === 'loaded' && !eventTickets.length) ? (
        <h1 className="px-20 py-10 text-3xl">No tickets in event</h1>) 
      :(
        <div className="px-5">
            <div style={{marginTop:"20px"}}> 
              {eventTickets.length && (<p className="text-3xl font-semibold capitalize">{eventTickets[0].name}</p>)}

              <div className='flex gap-5 mt-2'>
                {eventTickets.length && (<img width="20%" height="20%" src={eventTickets[0].image}/>)}
                <div style={{marginTop:"30px", fontSize: "18px"}}>
                  {eventTickets.length && (<p className="capitalize">{eventTickets[0].description}</p>)}
                  {eventTickets.length && (<p className="my-2">{eventTickets[0].date}</p>)}
                  {eventTickets.length && (<p className="my-5">Number of Tickets available: {eventTickets.length}</p>)}
                </div>
              </div>
              
            </div>
  
          <hr className='mt-7'></hr>
          <div className='mt-2'>
              <p className="text-lg">Original Tickets</p>
              {!originalTixs.length ? (<h1 className="text-gray-400 my-1">No tickets available</h1>): (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-6 mt-3">
                    {originalTixs.map((ticket, i) => (
                      <div key={i} className="p-3 border border-white shadow rounded-lg overflow-hidden">
                        <p className="mt-1 text-lg font-semibold text-center">{ticket.price} ETH</p>   
                        <button className="w-full mt-2 bg-pink-500 text-white py-1 px-3 rounded text-base" onClick={() => buyNft(ticket)}>Buy Ticket</button>
                        
                      </div>
                    ))}
              </div>)}
            </div>
            <hr className='mt-8'></hr>
            <div className='mt-2'>
              <p className="text-lg">Relisted Tickets</p>
              {!resellTixs.length ? (<h1 className="text-gray-400 my-1">No tickets available</h1>): (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-12 gap-y-6 mt-3">
                    {resellTixs.map((ticket, i) => (
                      <div key={i} className="p-3 border bg-black border-white shadow rounded-lg overflow-hidden">
                          <p className="mt-1 text-lg text-white font-semibold text-center">{ticket.price} ETH</p>
                          <button className="w-full mt-2 bg-pink-500 text-white py-1 px-3 rounded text-base" onClick={() => buyNft(ticket)}>Buy Ticket</button>
                      </div>
                    ))}
              </div>)}
            </div>

      </div>)}
    </div>
  );
}