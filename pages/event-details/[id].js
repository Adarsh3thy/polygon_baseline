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
              {eventTickets.length && (<p className="text-2xl font-semibold">{eventTickets[0].name}</p>)}
              {eventTickets.length && (<img width="20%" height="20%" src={eventTickets[0].image}/>)}
              {eventTickets.length && (<p className="text-gray-400">{eventTickets[0].description}</p>)}
              {eventTickets.length && (<p className="text-gray-400">Number of Tickets available: {eventTickets.length}</p>)}
            </div>

        <div style={{marginTop:"20px"}}>
            <p className="text-2xl">Original Tickets</p>
            {!originalTixs.length ? (<h1>No tickets available</h1>): (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-3">
                  {originalTixs.map((ticket, i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                      <div className="p-4 bg-black">
                          <p className="text-2xl text-white">{ticket.price} ETH</p>
                          <button className="mt-4 w-full bg-pink-500 text-white py-2 px-12 rounded" onClick={() => buyNft(ticket)}>Purchase Ticket</button>
                      </div>
                    </div>
                  ))}
            </div>)}
          </div>

          <div style={{marginTop:"20px"}}>
            <p className="text-2xl">Resell Tickets</p>
            {!resellTixs.length ? (<h1>No tickets available</h1>): (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
                  {resellTixs.map((ticket, i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                      <div className="p-4 bg-black">
                          <p className="text-2xl text-white">{ticket.price} ETH</p>
                          <button className="mt-4 w-full bg-pink-500 text-white py-2 px-12 rounded" onClick={() => buyNft(ticket)}>Purchase Ticket</button>
                      </div>
                    </div>
                  ))}
            </div>)}
          </div>

      </div>
      )}
    </div>
  );

}