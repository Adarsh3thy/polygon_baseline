export const events = [{
    id: 1,
    image: 'event1.jpeg',
    name:"SJSU graduation 2023",
    description:"description",
    price: 0.01,
    totalTickets: 20
},
{
    id: 2,
    image: 'event2.png',
    name:"SJSU - ISO - Holi",
    description:"description",
    price: 0.01,
    totalTickets: 10
},
{
    id: 3,
    image: 'event3.jpg',
    name:"Weeks of Welcome at SJSU",
    description:"description",
    price: 0.01,
    totalTickets: 25
}
]


export const getEventDetails = (id) => {
    let required_event = events.find(event => event.id = id)
    return required_event
  }