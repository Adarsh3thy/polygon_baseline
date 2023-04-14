/* pages/_app.js */
import '../styles/globals.css'
import Link from 'next/link'

function MyApp({ Component, pageProps }) {
  return (
    <div>

      <div>
      <nav className="border-b p-6">
        <p className="text-4xl font-bold">Blockchain Ticketing System</p>
        <div  className="flex mt-4">

          <div style={{float:"left"}}>
            <Link href="/">
              <a className="mr-4 text-pink-500">
                Home
              </a>
            </Link>
            <Link href="/create-event">
              <a className="mr-6 text-pink-500">
                Create Event
              </a>
            </Link>
          </div>

          <div style={{color:"red"}}>
            <Link href="/my-tickets">
              <a className="mr-6 text-pink-500">
                My Tickets
              </a>
            </Link>
            <Link href="/my-events">
              <a className="mr-6 text-pink-500">
                My Events
              </a>
            </Link>
          </div>
      
        </div>
      </nav>
      </div>
      

      <div>
        <Component {...pageProps} />
      </div>
    </div>
  )
}

export default MyApp