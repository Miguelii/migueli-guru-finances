import { createAssetSchema } from '@/_bff/modules/assets/assets.dto'
import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { updateAsset } from './update-asset.service'

export const UPDATE_ASSET_PROTECTED_CONTROLLER = protectedProcedure
    .input(createAssetSchema)
    .mutation(({ input }) =>
        runEffect(updateAsset(input), 'updateAsset', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('UploadAssetImageError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
