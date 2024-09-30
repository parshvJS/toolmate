import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

import { BrowserRouter } from 'react-router-dom'
import UserContextProvider from './context/userContext.tsx'
// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}
createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            {/* custom providers */}
            <UserContextProvider>
                <App />
            </UserContextProvider>
        </ClerkProvider>
    </BrowserRouter>

)
