import { createContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { env } from "@/lib/environment";
import { useAuth } from "@clerk/clerk-react";

interface UserData {
    planAccess: [boolean, boolean, boolean];
    id: string;
}

interface UserContextType {
    data: UserData | undefined | null;
    isLoading: boolean;
    isError: boolean;
}

const INITIAL_USER_DATA: UserContextType = {
    data: null,
    isLoading: false,
    isError: false,
};

const UserContext = createContext<UserContextType>(INITIAL_USER_DATA);

function UserContextProvider({ children }: { children: ReactNode }) {
    const { userId } = useAuth();

    // useQuery now accepts a single options object
    const { data, isLoading, isError } = useQuery<UserData, Error>({
        queryKey: ['user', userId], // Query key
        queryFn: async () => {
            if (!userId) {
                throw new Error("User ID is not available");
            }
            const response = await axios.post(`${env.domain}/api/v1/getUserPaidAndPersonalInfo`, {
                clerkUserId: userId,
            });
            return response.data.data; // Adjust based on your API response structure
        },
        enabled: !!userId, // Enables the query only if userId is available
    });

    const value = {
        data,
        isLoading,
        isError,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export default UserContextProvider;
export { UserContext };
