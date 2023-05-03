// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

import "hardhat/console.sol";

contract NFTMarketplace is ERC721URIStorage {
    using Counters for Counters.Counter;
    // to assign ids of new tokens that are created
    Counters.Counter private _tokenIds;
    Counters.Counter private _eventIds;
    Counters.Counter private _soldItems;

    //listing price of each ticket, if multiple tickets are made then the value sent should be n*listingPrice
    uint256 listingPrice = 0.025 ether;

    //address of the owner of this smart contract
    address payable owner;

    struct EventToken {
        uint256 eventId;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        address payable creator;
        uint256 price;
        bool sold;
        bool isResold;
    }

    //event id => event map
    mapping(uint256 => EventToken) private idToEventToken;

    //when ticket is transferred we emit this event
    event TokenUpdated (
        uint256 eventId,
        uint256 tokenId,
        address seller,
        address owner,
        address creator,
        uint256 price,
        bool sold,
        bool isResold
    );

    //constructor to set token name, symbol and owner
    constructor() ERC721("MarketPlace", "295B") {
        owner = payable(msg.sender);
    }

    //get and set functions for listing price, wont be used.
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function setListingPrice(uint newListingPrice) public payable {
        require(owner == msg.sender, "Only owner of the marketplace can update the price");
        listingPrice = newListingPrice;
    } 

    //function to create event and event tickets
    function createToken(string memory tokenURI, uint256 numTickets, uint256 price) public payable returns (uint) {
        console.log("Starting createToken");
        require(price > 0, "Price must be at least 1 wei");
        require(numTickets > 0, "At least 1 ticket in the event");
        require(msg.value >= (listingPrice * numTickets), "Not enough wei to list the tickets");

        _eventIds.increment();
        uint256 currentEventId = _eventIds.current();
        console.log("Current event id", currentEventId);
        uint256 currentToken = 0;
        for(currentToken=0; currentToken < numTickets; currentToken++) {
            _tokenIds.increment();
            uint256 newTokenId = _tokenIds.current();

            _mint(msg.sender, newTokenId);
            _setTokenURI(newTokenId, tokenURI);

            idToEventToken[newTokenId] = EventToken(
                currentEventId,
                newTokenId,
                payable(msg.sender),
                payable(address(this)),
                payable(msg.sender),
                price,
                false,
                false
            );
            _transfer(msg.sender, address(this), newTokenId);

            emit TokenUpdated(
                currentEventId, 
                newTokenId, 
                msg.sender, 
                address(this),
                msg.sender,  
                price, 
                false,
                false
            );
        }
        console.log("NFTs created");
        return currentEventId;
    }

    // function to call to create a sale of a token
    function createMarketSale(uint256 tokenId) public payable {
        console.log("createMarketSale for token", tokenId, " Sent with value", msg.value);
        uint price = idToEventToken[tokenId].price;
        address seller = idToEventToken[tokenId].seller;

        require(msg.value >= price, "Please send atleast the asking price");

        idToEventToken[tokenId].owner = payable(msg.sender);
        idToEventToken[tokenId].sold = true;
        idToEventToken[tokenId].seller = payable(address(0));

        _transfer(address(this), msg.sender, tokenId);
        payable(owner).transfer(listingPrice);
        payable(seller).transfer(msg.value);

        _soldItems.increment();
        console.log("Done");
        // ToDO: Add emit for token Updated

        // emit TokenUpdated(
        //     idToEventToken[tokenId].eventId, 
        //     idToEventToken[tokenId].tokenId, 
        //     idToEventToken[tokenId].seller, 
        //     idToEventToken[tokenId].owner, 
        //     idToEventToken[tokenId].price, 
        //     idToEventToken[tokenId].sold,
        //     idToEventToken[tokenId].isResold
        // );
    }

    //function to resell token back to the seller
    function resellToken(uint256 tokenId, uint256 price) public payable {
        require(idToEventToken[tokenId].owner == msg.sender, "Bro its not your token to sell");
        require(msg.value == listingPrice, "Resend the listing price to list the token again");

        idToEventToken[tokenId].sold = false;
        idToEventToken[tokenId].isResold = true;
        idToEventToken[tokenId].price = price;
        idToEventToken[tokenId].seller = payable(msg.sender);
        idToEventToken[tokenId].owner = payable(address(this));

        _transfer(msg.sender, address(this), tokenId);

        _soldItems.decrement();

        // ToDo: Add emit for token Updated
        // emit TokenUpdated(
        //     idToEventToken[tokenId].eventId, 
        //     idToEventToken[tokenId].tokenId, 
        //     idToEventToken[tokenId].seller, 
        //     idToEventToken[tokenId].owner, 
        //     idToEventToken[tokenId].price, 
        //     idToEventToken[tokenId].sold,
        //     idToEventToken[tokenId].isResold
        // );
    }

    //unsold items on the market
    function fetchMarketItems() public view returns(EventToken[] memory) {
        uint itemCount = _tokenIds.current();
        uint unsoldItemCount = itemCount - _soldItems.current();
        uint currentIndex = 0;

        EventToken[] memory items = new EventToken[](unsoldItemCount);
        for(uint i=0; i<itemCount; i++) {
            if(idToEventToken[i+1].owner == address(this)) {
                uint currentId = i+1;
                EventToken storage currentItem = idToEventToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex++;
            }
        }

        return items;
    }

    //returns the items that a user has purchased
    function fetchMyNFTs() public view returns (EventToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i=0; i<totalItemCount; i++) {
            if(idToEventToken[i+1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        EventToken[] memory items = new EventToken[](itemCount);
        for(uint i=0; i<totalItemCount; i++) {
            if(idToEventToken[i+1].owner == msg.sender) {
                uint currentId = i+1;
                EventToken storage currentItem = idToEventToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

    //returns the items that a seller has listed
    function fetchItemsListed() public view returns (EventToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for(uint i=0; i<totalItemCount; i++) {
            if(idToEventToken[i+1].creator == msg.sender) {
                itemCount += 1;
            }
        }

        EventToken[] memory items = new EventToken[](itemCount);
        for(uint i=0; i<totalItemCount; i++) {
            if(idToEventToken[i+1].creator == msg.sender) {
                uint currentId = i+1;
                EventToken storage currentItem = idToEventToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

}