'use client'

import { useQueryState } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { bankConnectionResultParser, paramsUrlKeys } from '@/lib/core/searchParams'
import { BANK_CONNECTION_TOAST } from '@/modules/emergency-fund/emergency-fund-card.constants'

// Reports the result of /api/bank/callback once, then clears it from the URL
export function BankConnectionToast() {
    const [result, setResult] = useQueryState(
        paramsUrlKeys.bank!,
        bankConnectionResultParser.withOptions({ shallow: true })
    )

    useEffect(() => {
        if (!result) return

        if (result === 'connected') toast.success(BANK_CONNECTION_TOAST.connected)
        else toast.error(BANK_CONNECTION_TOAST.error)

        void setResult(null)
    }, [result, setResult])

    return null
}
