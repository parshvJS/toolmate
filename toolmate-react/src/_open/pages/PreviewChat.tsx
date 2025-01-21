import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { LoaderPinwheel, ShieldX } from "lucide-react";
import { useEffect, useState } from "react";



export default function PreviewChat() {
  // global state
  const { toast } = useToast()




  //component  state
  // - this state is related to create session
  const [isSessionLoading, setIsSessionLoading] = useState(false)
  const [isSessionValid, setIsSessionValid] = useState(true)
  const [isFreePlanOver, setIsFreePlanOver] = useState(false)
  const [currentCredit, setCurrentCredit] = useState(0)
  // create new session 
  async function getSessionDetails() {
    setIsSessionLoading(true)
    try {
      const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/v1/preview/createSession`);
      if (!res.data.success) {
        toast({
          title: "Error",
          description: res.data.message,
          variant: "destructive"
        })
        setIsSessionValid(false)
      }

      if (res.data.isSessionOver) {
        setIsFreePlanOver(true)
      }
      else{
        setCurrentCredit(res.data.credit)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "cant get session",
        variant: "destructive"
      })
    } finally {
      setIsSessionLoading(false)
    }
  }


  async function deductCredit() {
    try {

    } catch (error) {
      toast({
        title: "Error",
        description: "cant get session",
        variant: "destructive"
      })

    }
  }

  // use effect
  useEffect(() => {
    getSessionDetails()
  }, [])


  // JSX Bounday
  if (isSessionLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <div className="flex flex-col items-center space-y-4">
          <LoaderPinwheel className="w-12 h-12 text-yellow animate-spin" />
          <p className="text-lg font-semibold text-gray-700">Loading Session...</p>
          <p className="text-sm text-gray-500">Please wait while we prepare your session.</p>
        </div>
      </div>
    )
  }


  if (!isSessionValid) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <ShieldX className="w-12 h-12 text-red-500" />
        <p className="text-lg font-semibold text-red-500">Access Denied</p>
        <p className="text-center text-gray-600">You do not have permission to view this page. Please contact the administrator if you believe this is an error.</p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center  w-full h-full">
      <div className="max-w-6xl">
        asdas
      </div>
    </div>
  )
}
