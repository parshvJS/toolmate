import { createContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { env } from "@/lib/environment";
import { useAuth } from "@clerk/clerk-react";

interface SideBarHistItem {
    sessionId: string;
    chatName: string;
}

interface SideBarItem {
    dateDiff: string;
    data: SideBarHistItem[];
}

interface UserData {
    planAccess: [boolean, boolean, boolean];
    id: string;
    sideBarHisotry: SideBarItem[];
}

interface UserContextType {
    userData: UserData | undefined;
    historyData: SideBarItem[] | undefined;
    isLoading: boolean;
    isError: boolean;
    isFetching: boolean;
    unshiftSidebarItem: (newItem: SideBarHistItem) => void;
}

const INITIAL_USER_DATA: UserContextType = {
    userData: undefined,
    historyData: undefined,
    isLoading: false,
    isError: false,
    isFetching: false,
    unshiftSidebarItem: () => { },
};

const UserContext = createContext<UserContextType>(INITIAL_USER_DATA);

function UserContextProvider({ children }: { children: ReactNode }) {
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    const { data: userData, isLoading, isError, isFetching } = useQuery<UserData, Error>({
        queryKey: ['user', userId],
        queryFn: async () => {
            if (!userId) {
                throw new Error("User ID is not available");
            }
            const response = await axios.post<{ data: UserData }>(`${env.domain}/api/v1/getUserPaidAndPersonalInfo`, {
                clerkUserId: userId,
            });
            return response.data.data;
        },
        enabled: !!userId,                  // Only run the query if userId exists
        refetchOnWindowFocus: false,         // No refetch on window focus
        refetchOnReconnect: false,           // No refetch when network reconnects
        refetchInterval: false,              // No periodic refetch
        staleTime: Infinity,                 // Data is always considered fresh
        // Cache data forever (you can change this if you want a specific time)
    });


    const { data: historyData } = useQuery<SideBarItem[], Error>({
        queryKey: ['chatHistory', userData?.id],
        queryFn: async () => {
            if (!userData?.id) {
                throw new Error("User ID is not available");
            }
            const response = await axios.post<{ data: SideBarItem[] }>(`${env.domain}/api/v1/getChatHistory`, {
                userId: userData.id,
            });
            return response.data.data;
        },
        enabled: !!userData?.id,             // Only run when userData.id exists
        refetchOnWindowFocus: false,         // No refetch on window focus
        refetchOnReconnect: false,           // No refetch when network reconnects
        refetchInterval: false,              // No periodic refetch
        staleTime: Infinity,                 // Data is always considered fresh
    });


    const mutation = useMutation<SideBarItem[], Error, SideBarItem[], { previousHistory: SideBarItem[] | undefined }>({
        mutationFn: (newHistory: SideBarItem[]) => {
            console.log("mutation called");
            return axios.post(`${env.domain}/api/v1/updateChatHistory`, {
                userId: userData?.id,
                newHistory,
            });
        },
        onMutate: async (newHistory: SideBarItem[]) => {
            await queryClient.cancelQueries({ queryKey: ['chatHistory', userData?.id] });
            const previousHistory = queryClient.getQueryData<SideBarItem[]>(['chatHistory', userData?.id]);
            queryClient.setQueryData(['chatHistory', userData?.id], newHistory);
            return { previousHistory };
        },
        onError: (err, newHistory, context) => {
            if (context?.previousHistory) {
                queryClient.setQueryData(['chatHistory', userData?.id], context.previousHistory);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['chatHistory', userData?.id] });
        },
    });

    const unshiftSidebarItem = (newItem: SideBarHistItem) => {
        const today = "today";
        const updatedHistory = historyData ? [...historyData] : [];

        const todayItemIndex = updatedHistory.findIndex((item) => item.dateDiff === today);

        if (todayItemIndex > -1) {
            updatedHistory[todayItemIndex].data.unshift(newItem);
        } else {
            updatedHistory.unshift({
                dateDiff: today,
                data: [newItem],
            });
        }
        console.log(updatedHistory, "updatedHistory");
        mutation.mutate(updatedHistory);
    };

    const value: UserContextType = {
        userData,
        historyData,
        isLoading,
        isError,
        isFetching,
        unshiftSidebarItem,
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export default UserContextProvider;
export { UserContext };
