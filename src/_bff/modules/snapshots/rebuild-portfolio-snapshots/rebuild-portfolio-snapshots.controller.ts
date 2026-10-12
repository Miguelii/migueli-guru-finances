import { Match } from 'effect'
import { protectedProcedure } from '@/_bff/trpc/server'
import { runEffect } from '@/_bff/trpc/utils'
import { rebuildPortfolioSnapshots } from '@/_bff/modules/snapshots/rebuild-portfolio-snapshots/rebuild-portfolio-snapshots.service'

export const REBUILD_PORTFOLIO_SNAPSHOTS_PROTECTED_CONTROLLER = protectedProcedure.mutation(
    ({ ctx }) =>
        runEffect(rebuildPortfolioSnapshots(ctx.user.id), 'rebuildPortfolioSnapshots', (error) =>
            Match.value(error).pipe(
                Match.tag('CreateSbClientError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.tag('SbQueryError', () => 'INTERNAL_SERVER_ERROR' as const),
                Match.exhaustive
            )
        )
)
