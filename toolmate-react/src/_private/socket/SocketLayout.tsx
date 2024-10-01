import SocketProvider from "@/context/socketContext";
import { Outlet } from "react-router-dom";

export function SocketLayout(){
    console.log("SocketLayout")
    return (
        <SocketProvider>
            <Outlet/>
        </SocketProvider>
    )
}