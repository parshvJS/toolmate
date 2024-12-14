import React, { createContext, useState, useContext, ReactNode } from 'react';
import axios from 'axios';

interface SubscriptionContextType {
  subscriptionData: {
    planName: string;
    subscriptionId: string;
    planLastUpdated: string;
    pricePaid: number;
    planStatus: string;
    nextBillingCycle: string;
    planStartedOn: string;
    lastPaidOn: string;
    cycleExecutionLogs: any[];
  } | null;
  paymentLogs: any[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptionDetails: (subscriptionId: string) => Promise<void>;
  fetchPaymentLogs: (userId: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [paymentLogs, setPaymentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInfoPanalOpen, setIsInfoPanalOpen] = useState(false);
  const []
  const fetchSubscriptionDetails = async (subscriptionId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getSubscriptionDetails`, {
        subscriptionId: subscriptionId
      });

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      const subscription = response.data.subscription;
      setSubscriptionData({
        planName: subscription.planName,
        subscriptionId: subscription.id,
        planLastUpdated: subscription.update_time,
        pricePaid: parseFloat(subscription.billing_info.last_payment.amount.value),
        planStatus: subscription.status,
        nextBillingCycle: subscription.billing_info.next_billing_time,
        planStartedOn: subscription.start_time,
        lastPaidOn: subscription.billing_info.last_payment.time,
        cycleExecutionLogs: subscription.billing_info.cycle_executions
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPaymentLogs = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/v1/getSubscriptionLogs`, {
        userId: userId
      });

      if (response.status !== 200) {
        throw new Error("Failed to fetch subscription logs");
      }

      setPaymentLogs(response.data.logs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscriptionData,
        paymentLogs,
        isLoading,
        error,
        fetchSubscriptionDetails,
        fetchPaymentLogs
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};