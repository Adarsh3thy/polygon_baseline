import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function CreatorDashboard() {
  const [nfts, setNfts] = useState([])
  const [loadingState, setLoadingState] = useState('not-loaded')
  useEffect(() => {
    loadNFTs()
  }, [])
  async function loadNFTs() {
    const web3Modal = new Web3Modal({
      network: 'mainnet',
      cacheProvider: true,
    })
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()

    const contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    const data = await contract.fetchItemsListed()

    const items = await Promise.all(data.map(async i => {
      const tokenUri = await contract.tokenURI(i.tokenId)
      const meta = await axios.get(tokenUri)
      let price = ethers.utils.formatUnits(i.price.toString(), 'ether')
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.data.image,
        sold : i.sold.toString(),
        eventId : i.eventId.toNumber(),
        name : meta.data.name,
      }
      return item
    }))

    const groupedItems = items.reduce((acc, curr) => {
      const eventId = curr.event
      if (!acc[eventId]) {
        acc[eventId] = []
      }
      acc[eventId].push(curr)
      return acc
    }, {})

    const groupedNfts = items.reduce((acc, item) => {
      const key = `${item.eventId}_${item.price}`;
      if (!acc[key] ) {
        acc[key] = {
          name: item.name,
          image: item.image,
          price : item.price,
          count: 1
        };
      } else {
        acc[key].count++;
      }
      return acc;
    }, {});

    setNfts(groupedNfts)
    setLoadingState('loaded') 
  }
  if (loadingState === 'loaded' && !Object.keys(nfts)) return (<h1 className="py-10 px-20 text-3xl">No NFTs listed</h1>)
  return (
    <div>
      <div className="px-5 py-5">
          <div className="grid grid-cols-6 sm:grid-cols-3 lg:grid-cols-6 gap-6">
          {
            Object.keys(nfts).map(key => { 
             
              const [eventId, price] = key.split('_');
              return (
              <div key={key} className="border shadow rounded-xl overflow-hidden">
                <img src={nfts[key].image} width="100%" height="100%" className="rounded" />
                <div className="p-4">
                  <p className="text-xl font-bold capitalize">Event Name : {nfts[key].name} </p>
                  <p className="text-1xl capitalize">price : {nfts[key].price} Eth </p>
                  <p className="text-1xl capitalize">count : {nfts[key].count}  </p>
                </div>
              </div>
              );
            })
          }
        </div>
      </div>
    </div>
  )
}