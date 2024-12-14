import React, { useContext, useState } from "react";
import Logo from "@/components/custom/Logo";
import { CreditCard, BadgeCheck, DollarSign, RefreshCw, ChevronDown, ChevronRight, Logs, LoaderCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import MateyExpression from "@/components/custom/MateyExpression";
import { useAuth } from "@clerk/clerk-react";
import { useSubscription } from "@/context/SubscriptionDetailsContext";
import { UserContext } from "@/context/userContext";

export default function ManageSub() {
    const [activeTab, setActiveTab] = useState("details");
    const { userData } = useContext(UserContext);
    const {
        subscriptionData,
        paymentLogs,
        isLoading,
        error,
        fetchSubscriptionDetails,
        fetchPaymentLogs
    } = useSubscription();

    const tabs = [
        { id: "details", label: "Plan Information", icon: CreditCard },
        { id: "logs", label: "Activity", icon: Logs },
        { id: "curr", label: "Subscription Management", icon: BadgeCheck },
        { id: "refund", label: "Refund Management", icon: RefreshCw },
    ];

    React.useEffect(() => {
        if (userData && userData.id && userData.activePlan) {
            fetchSubscriptionDetails(userData.activePlan as string);
            fetchPaymentLogs(userData.id);
        }
    }, [userData]);

    function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
        return (
            <div className="flex items-center space-x-3 text-left">
                <div className="bg-slate-100 p-2 rounded-full">{icon}</div>
                <div>
                    <p className="text-sm sm:text-base font-medium text-slate-600">{label}</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-900">{value}</p>
                </div>
            </div>
        );
    }

    function CurrentPlanDetails() {
        const [isShowCycleDetails, setIsShowCycleDetails] = useState(false);

        if (!subscriptionData) return null;

        return (
            <div className="flex flex-col items-center justify-center p-4 sm:p-6">
                <Card className="w-full bg-white shadow-lg">
                    <CardContent className="p-4 sm:p-6 space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
                            <Badge variant="outline" className="text-slate-500 border-yellow border-2">
                                {subscriptionData.planName}
                            </Badge>
                            <span className="text-sm text-slate-600">
                                Last Updated: {new Date(subscriptionData.planLastUpdated).toLocaleString()}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InfoItem
                                icon={<CreditCard className="w-5 h-5" />}
                                label="Subscription ID"
                                value={subscriptionData.subscriptionId}
                            />
                            <InfoItem
                                icon={<CreditCard className="w-5 h-5" />}
                                label="Price Paid"
                                value={String(subscriptionData.pricePaid)}
                            />
                            <InfoItem
                                icon={<CalendarDays className="w-5 h-5" />}
                                label="Next Billing Cycle"
                                value={new Date(subscriptionData.nextBillingCycle).toLocaleString()}
                            />
                            <InfoItem
                                icon={<CalendarDays className="w-5 h-5" />}
                                label="Plan Started On"
                                value={new Date(subscriptionData.planStartedOn).toLocaleString()}
                            />
                            <InfoItem
                                icon={<CalendarDays className="w-5 h-5" />}
                                label="Last Paid On"
                                value={new Date(subscriptionData.lastPaidOn).toLocaleString()}
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-slate-50 rounded-lg w-full">
                    <div
                        className="flex my-2 gap-2 items-center cursor-pointer text-slate-600 hover:text-slate-800 transition-colors duration-200"
                        onClick={() => setIsShowCycleDetails(!isShowCycleDetails)}
                    >
                        <p className="font-semibold px-3 py-2">Cycle Details</p>
                        {isShowCycleDetails ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    {isShowCycleDetails && <CycleLogCard log={subscriptionData.cycleExecutionLogs} />}
                </div>
            </div>
        );
    }

    function CycleLogCard({ log }: { log: any[] }) {
        const keys = log.length > 0 ? Object.keys(log[0]) : [];

        return (
            <Table className="bg-white rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
                <TableHeader>
                    <TableRow>
                        {keys.map((key) => (
                            <TableCell key={key} className="font-medium text-slate-600 capitalize">
                                {key.replace(/([A-Z])/g, " $1").replace("_", " ").trim()}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {log.map((entry, index) => (
                        <TableRow key={index}>
                            {keys.map((key) => (
                                <TableCell key={key} className="text-slate-700">
                                    {entry[key]}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        );
    }

    function PlanInfoTab() {
        if (isLoading) {
            return (
                <div className="w-full p-4 m-4 text-center h-full flex flex-col border-2 border-slate-200 text-slate-600 rounded-md items-center justify-center">
                    <LoaderCircle className="animate-spin" />
                    <span className="ml-2">Loading Subscription Details...</span>
                </div>
            );
        }

        if (!subscriptionData) {
            return (
                <div className="flex flex-col border-slate-200 border-2 rounded-md p-4 m-4">
                    <div className="flex flex-col gap-2 justify-center items-center font-semibold ">
                        <MateyExpression expression="2thumb" />
                        <p>You currently do not have any active plans.</p>
                    </div>
                </div>
            );
        }

        return (
            <>
                <CurrentPlanDetails />
            </>
        );
    }

    function PaymentLogs() {
        if (paymentLogs.length === 0) {
            return <div className="w-full p-4 text-center">No subscription logs found.</div>;
        }

        return (
            <div className="w-full p-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-[#FF8F00]">Subscription ID</TableHead>
                            <TableHead className="text-[#FF8F00]">Plan Name</TableHead>
                            <TableHead className="text-[#FF8F00]">Coupon Applied</TableHead>
                            <TableHead className="text-[#FF8F00]">Coupon Code</TableHead>
                            <TableHead className="text-[#FF8F00]">Base Billing Plan ID</TableHead>
                            <TableHead className="text-[#FF8F00]">Status</TableHead>
                            <TableHead className="text-[#FF8F00]">Activity Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paymentLogs.map((payment, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium text-[#FF5900]">
                                    {payment.subscriptionId}
                                </TableCell>
                                <TableCell>{payment.planName}</TableCell>
                                <TableCell>{payment.isCouponApplied ? "Yes" : "No"}</TableCell>
                                <TableCell>{payment.couponCode || "-"}</TableCell>
                                <TableCell>{payment.baseBillingPlanId || "-"}</TableCell>
                                <TableCell className={payment.status === "ACTIVE" ? "text-green-600" : "text-red-600"}>
                                    {payment.status}
                                </TableCell>
                                <TableCell>{new Date(payment.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    function SubscriptionDetails() {
        return <div>Subscription Details</div>;
    }

    function RefundLogs() {
        return <div>Refund Logs</div>;
    }

    return (
        <div className="">
            {/* nav bar */}
            <div className="bg-mangoYellow p-2 w-full flex justify-between">
                <div className="w-fit">
                    <Logo />
                </div>
                <div className="bg-whiteYellow border-2 border-yellow rounded-full md:hidden block">
                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-1">
                            <img src="/assets/line2.svg" className="" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuSeparator />
                            {tabs.map(tab => (
                                <DropdownMenuItem key={tab.id} onClick={() => setActiveTab(tab.id)}>
                                    {tab.label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="p-5 flex gap-2">
                <div className="flex gap-10 w-full h-full ">
                    <div className="md:flex hidden w-fit gap-2 mt-8 flex-col h-fit transition-all">
                        {tabs.map(tab => (
                            <div
                                key={tab.id}
                                className={`${activeTab === tab.id && "bg-paleYellow border-yellow"} transition-all border-r-4 rounded-l-md border-transparent items-center flex px-4 py-2 font-semibold cursor-pointer`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <tab.icon className="w-5 h-5" />
                                <span className="ml-2">{tab.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="md:w-[calc(100%-350px)] h-full">
                        {activeTab === "details" && <PlanInfoTab />}
                        {activeTab === "logs" && <PaymentLogs />}
                        {activeTab === "curr" && <SubscriptionDetails />}
                        {activeTab === "refund" && <RefundLogs />}
                    </div>
                </div>
            </div>
        </div>
    );
}