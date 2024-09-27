import LoadingPage from "@/components/custom/LoadingPage"
import Sidebar from "@/components/custom/Sidebar"
import { useAuth } from "@clerk/clerk-react"
import { Outlet, useNavigate } from "react-router-dom"

export default function DashaboardLayout() {
    const { isLoaded, userId, sessionId } = useAuth()
    const navigator = useNavigate()
    if (!isLoaded) {
        return <LoadingPage title="Preparing Dashboard..." />
    }
    if (!userId && isLoaded) {
        navigator("/signin")
    }
    return (
        <div className="w-screen h-screen flex">
            <Sidebar />
            <Outlet />
        </div>
    )
}