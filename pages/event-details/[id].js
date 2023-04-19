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

  const [eventName, setEventName] = useState('');

  useEffect(()=>{
    if(!router.isReady) return;

    setEventId(router.query.id)
    loadNFTs()
  },[router.isReady])

  useEffect(() => {
    loadEventTickets();
  }, [nfts])


  async function loadNFTs() {
    /* create a generic provider and query for unsold market items */
    const provider = new ethers.providers.JsonRpcProvider()
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider)
    const data = await contract.fetchMarketItems()

    /*
    *  map over items returned from smart contract and format 
    *  them as well as fetch their token metadata
    */   
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
        <h1 className="px-20 py-10 text-3xl">No tickets in event</h1>
      ) : (
        <div className="flex justify-center">
                <div className="px-4" style={{ maxWidth: '1600px' }}> 
                    <div>
                        {eventTickets.length && (<p className="text-2xl font-semibold">{eventTickets[0].name}</p>)}
                        {eventTickets.length && (<img width="50%" height="50%" src={eventTickets[0].image}/>)}
                    <div>
                    {eventTickets.length && (<p className="text-gray-400">{eventTickets[0].description}</p>)}
                </div>
        </div>
        <div style={{marginTop:"20px"}}>
            <h2>Tickets section</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                {
                eventTickets.map((ticket, i) => (
                    <div key={i} className="border shadow rounded-xl overflow-hidden">
                    <div className="p-4 bg-black">
                        <p className="text-2xl font-bold text-white">{ticket.price} ETH</p>
                        <button className="mt-4 w-full bg-pink-500 text-white font-bold py-2 px-12 rounded" onClick={() => buyNft(nft)}>Purchase Ticket</button>
                    </div>
                    </div>
                ))
                }
            </div>
        </div>
            
            </div>
        </div>
      )}
    </div>
  );

}