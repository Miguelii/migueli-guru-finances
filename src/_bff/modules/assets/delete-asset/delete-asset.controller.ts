import { deleteAssetSchema } from '@/_bff/modules/assets/assets.dto'
import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { deleteAsset } from './delete-asset.service'

export const DELETE_ASSET_PROTECTED_CONTROLLER = protectedProcedure
    .input(deleteAssetSchema)
    .mutation(({ input }) =>
        runEffect(deleteAsset(input.ticker), 'deleteAsset', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
