import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

import { useRouter } from 'next/router';

export default function Home() {
  const [events, setEvents] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')

  let router= useRouter()

  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {

    const provider = new ethers.providers.JsonRpcProvider()
    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, provider)
    const data = await contract.fetchMarketItems()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let item = {
        eventId: i.eventId.toNumber(),
        image: meta.data.image,
        name: meta.data.name,
        description: meta.data.description,
      }
      return item
    }));

    const unique_events = [...new Map(items.map((item) => [item["eventId"], item])).values()];
    setEvents(unique_events);
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

  if (loadingState === 'loaded' && !events.length) return (<h1 className="px-20 py-10 text-3xl">No events</h1>)
  return (
    <div className="flex">
      <div className="px-5" style={{ maxWidth: '1600px' }}>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-5">
          {
            events.map((event, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden" onClick={()=> router.push(`/event-details/${event.eventId}`)}>
                <img src={event.image} />
                <div className="p-4">
                  <p style={{ height: '50px' }} className="text-2xl font-semibold">{event.name}</p>
                  <p className="text-gray-400">{event.description}</p>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}