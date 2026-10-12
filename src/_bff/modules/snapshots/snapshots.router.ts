import 'server-only'

import { GET_PORTFOLIO_SNAPSHOTS_PROTECTED_CONTROLLER } from '@/_bff/modules/snapshots/get-portfolio-snapshots/get-portfolio-snapshots.controller'
import { REBUILD_PORTFOLIO_SNAPSHOTS_PROTECTED_CONTROLLER } from '@/_bff/modules/snapshots/rebuild-portfolio-snapshots/rebuild-portfolio-snapshots.controller'
import { router } from '@/_bff/trpc/server'

export const SNAPSHOTS_ROUTER = router({
    getAll: GET_PORTFOLIO_SNAPSHOTS_PROTECTED_CONTROLLER,
    rebuild: REBUILD_PORTFOLIO_SNAPSHOTS_PROTECTED_CONTROLLER,
})
