import { ethers } from 'ethers'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Web3Modal from 'web3modal'

import {
  marketplaceAddress
} from '../config'

import { useRouter } from 'next/router';
import {events} from "./data";

import NFTMarketplace from '../artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json';


export default function Home() {

  let router= useRouter()

  return (
    <div className="flex justify-center">
      <div className="px-4" style={{ maxWidth: '1600px' }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      {
            events.map((event, i) => (
              <div key={i} className="border shadow rounded-xl overflow-hidden" onClick={()=> router.push(`/event-details/${event.id}`)}>
                <img src={event.image} />
                <div className="p-4">
                  <p style={{ height: '64px' }} className="text-2xl font-semibold">{event.name}</p>
                  <div style={{ height: '50px'}}>
                  {/* <div style={{ height: '50px', overflow: 'hidden' }}> */}
                    <p className="text-gray-400">{event.description} </p>
                    <p className="text-gray-400"> Total Tickets (need to modify this field): {event.totalTickets}</p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}