import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

import { BrowserRouter } from 'react-router-dom'
import UserContextProvider from './context/userContext.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Import your publishable key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
    throw new Error("Missing Publishable Key")
}
const queryClient = new QueryClient();
createRoot(document.getElementById('root')!).render(
    <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <QueryClientProvider client={queryClient}>

                {/* custom providers */}
                <UserContextProvider>
                    <App />
                </UserContextProvider>
            </QueryClientProvider>

        </ClerkProvider>
    </BrowserRouter>

)
