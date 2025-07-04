import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"
import { useSelector } from "react-redux"
import Loader from "./Loader"
import AIAssistantFab from "./AIAssistantFab"

const Layout = () => {
  const { loading: authLoading } = useSelector((state) => state.auth)

  if (authLoading) {
    return <Loader />
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      <AIAssistantFab />
    </div>
  )
}

export default Layout
