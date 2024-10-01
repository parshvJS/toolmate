import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { env } from "@/lib/environment";

const fetchUserData = async (userId: string) => {
  const response = await axios.post(`${env.domain}/api/v1/getUserPaidAndPersonalInfo`, {
    clerkUserId: userId,
  });
  return response.data.data;
};

const useUserData = (userId: string) => {
  return useQuery({
    queryKey: ["userPaidInfo", userId],
    queryFn: () => fetchUserData(userId),
    enabled: !!userId, // Only fetch if userId is available
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep data in cache for 30 minutes
  });
};

export default useUserData;
