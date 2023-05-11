import { useState } from 'react'
import { ethers } from 'ethers'
import { create as ipfsHttpClient } from 'ipfs-http-client'
import { useRouter } from 'next/router'
import Web3Modal from 'web3modal'

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0')

import {
  marketplaceAddress
} from '../config'

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json'

export default function CreateItem() {
  const [fileUrl, setFileUrl] = useState(null)
  const [formInput, updateFormInput] = useState({ price: '', name: '', description: '', numTickets: '', date: ''})
  const router = useRouter()
  const ipfsClient = require('ipfs-http-client');
  const projectId = '2Nbyc3pTaJLnAvtxihWqpSUr1zT'; 
  const projectSecret = '5d2750ac4f6c2a96f88ad06472c5d3a0'; 
  const gateway='polytestdom'

  const today = new Date();
  const todayFmt = today.toISOString().split('T')[0];
  
  const auth = 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64');
  const client = ipfsClient.create({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',
    apiPath: '/api/v0',
    headers: {
        authorization: auth,
    },
});

  async function onChange(e) {
    const file = e.target.files[0]
    console.log('got file', file);
    try {
      const added = await client.add(
        file,
        {
          progress: (prog) => console.log(`received: ${prog}`)
        }
      )
      const url = `https://${gateway}.infura-ipfs.io/ipfs/${added.path}`
      console.log("File url", url);
      setFileUrl(url)
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }
  async function uploadToIPFS() {
    const { name, description, price, numTickets, date } = formInput
    console.log('trying for', name, description, price, numTickets, date);
    if (!name || !description || !price || !fileUrl || !numTickets || !date) return
    /* first, upload to IPFS */
    const data = JSON.stringify({
      name, description, date, image: fileUrl
    })
    try {
      const added = await client.add(data)
      const url = `https://${gateway}.infura-ipfs.io/ipfs/${added.path}`
      /* after file is uploaded to IPFS, return the URL to use it in the transaction */
      return url
    } catch (error) {
      console.log('Error uploading file: ', error)
    }  
  }

  async function listNFTForSale() {
    const url = await uploadToIPFS()
    const web3Modal = new Web3Modal()
    const connection = await web3Modal.connect()
    const provider = new ethers.providers.Web3Provider(connection)
    const signer = provider.getSigner()
    
    /* next, create the item */
    const price = ethers.utils.parseUnits(formInput.price, 'ether')
    const numTickets = ethers.BigNumber.from(formInput.numTickets);
    let contract = new ethers.Contract(marketplaceAddress, NFTMarketplace.abi, signer)
    let listingPrice = await contract.getListingPrice();
    listingPrice = listingPrice.mul(numTickets);
    listingPrice = listingPrice.toString()
    console.log(listingPrice);
    let transaction = await contract.createToken(url, numTickets, price, { value: listingPrice });
    console.log("transaction done", transaction);
    await transaction.wait()
   
    router.push('/')
  }

  return (
    <div className="flex justify-center">
      <div className="w-1/2 flex flex-col pb-12">
        <input 
          placeholder="Event Name"
          className="mt-8 border rounded p-4 text-black"
          onChange={e => updateFormInput({ ...formInput, name: e.target.value })}
        />
        <textarea
          placeholder="Event Description"
          className="mt-2 border rounded p-4 text-black"
          onChange={e => updateFormInput({ ...formInput, description: e.target.value })}
        />
        <input 
          type='date'
          min={todayFmt}
          placeholder="Event Date"
          className="mt-8 border rounded p-4 text-black"
          onChange={e => updateFormInput({ ...formInput, date: e.target.value })}
        />
        <input
          placeholder="Ticket Price in Eth"
          className="mt-2 border rounded p-4 text-black"
          onChange={e => updateFormInput({ ...formInput, price: e.target.value })}
        />
        <input
          placeholder="Number of tickets"
          className="mt-2 border rounded p-4 text-black"
          onChange={e => updateFormInput({ ...formInput, numTickets: e.target.value })}
        />
        <input
          type="file"
          name="Asset"
          className="my-4"
          onChange={onChange}
        />
        {
          fileUrl && (
            <img className="rounded mt-4 border border-white" width="350" src={fileUrl} />
          )
        }
        <button onClick={listNFTForSale} className="font-bold mt-4 bg-pink-500 text-white rounded p-4 shadow-lg">
          Create Event
        </button>
      </div>
    </div>
  )
} 