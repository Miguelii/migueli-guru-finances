import { createAssetSchema } from '@/_bff/modules/assets/assets.dto'
import { protectedProcedure } from '@/_trpc/server'
import { runEffect } from '@/_trpc/utils'
import { Match } from 'effect'
import { createAsset } from './create-asset.service'

export const CREATE_ASSET_PROTECTED_CONTROLLER = protectedProcedure
    .input(createAssetSchema)
    .mutation(({ input }) =>
        runEffect(createAsset(input), 'createAsset', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('UploadAssetImageError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
    )
