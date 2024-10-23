// import {Link} from "react-router-dom"
import { useState, FormEvent, useContext } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axios from 'axios'
import { AuthContext } from "@/context/AuthContext"
import { LoaderCircle } from "lucide-react"
const Page: React.FC = () => {
    const [username, setUsername] = useState<string>("")
    const [password, setPassword] = useState<string>("")
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState(false)
    const {setUserData} = useContext(AuthContext)
    const handleSubmit =async  (event: FormEvent) => {
        event.preventDefault()
        setLoading(true)
        const serverUrl = import.meta.env.SERVER_URL!;

            try {
                const data = await axios.post(`${serverUrl}/api/v1/admin/login`, {
                    username,
                    password,
                })
                if(!(data.status === 200)){
                    setError(true)
                }
                console.log(data) 
            } catch (error) {
                console.log(error)
                setError(true)
            } finally  {
                setLoading(false)
            }
        console.log("Password:", password)
    }

    return (
        <div className="flex h-screen w-full items-center justify-center px-4">
            <Card className="mx-auto max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your Username below to login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Username</Label>
                            <Input
                                id="email"
                                type="text"
                                placeholder="m@example.com"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full text-white">
                            {
                        
                                loading ? (
                                    <LoaderCircle />
                                ) :("Login")
                                
                            }
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default Page