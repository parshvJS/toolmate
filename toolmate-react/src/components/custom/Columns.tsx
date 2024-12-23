"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { RefundLog } from "@/types/types"
import { RefundDetailsDialog } from "./Refund-logs-dialog"
import { useEffect, useState } from "react"

export const columns: ColumnDef<RefundLog>[] = [
    {
        accessorKey: "id",
        header: "Refund ID",
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        accessorKey: "amount",
        header: "Amount",
    },
    {
        accessorKey: "createdAt",
        header: "Activity Date",
        cell: ({ row }) => row.getValue("createdAt"),
    },
    {
        id: "actions",
        header: "Refund Details",
        accessorKey: "actions",
        cell: ({ row }) => {
            const refund = row.original
            const [isVisible, setIsVisible] = useState(false)
            useEffect(() => {
                console.log("isVisible", isVisible)
            }, [isVisible])
            return <div>
                <Button onClick={() => setIsVisible(true)}>View</Button>
                <RefundDetailsDialog refund={refund} isVisible={isVisible} setIsVisible={setIsVisible} />
            </div>

        },
    },
]

