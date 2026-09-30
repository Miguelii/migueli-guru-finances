export enum ErrorCode {
    // Auth - Session
    AUTH_SESSION_DB_CLIENT = 't5rv1k8p',
    AUTH_SESSION_GET_USER = 'y3wm7j2c',

    // Auth - Login
    AUTH_LOGIN_IS_BOT = 'b3xk7n2w',
    AUTH_LOGIN_DB_CLIENT = 'f8pm4t6j',
    AUTH_LOGIN_SIGN_IN = 'w2cs9h5v',

    // Auth - SignOut
    AUTH_SIGN_OUT_DB_CLIENT = 'j5rk8d3n',
    AUTH_SIGN_OUT_FAILED = 'n7vq2g4x',

    // Transactions
    TRANSACTIONS_DB_CLIENT = 'q7dn4x2f',
    TRANSACTIONS_GET_ALL_QUERY = 'm9kt3v6b',
    TRANSACTIONS_CREATE_QUERY = 'x8pv3k6d',
    TRANSACTIONS_UPDATE_QUERY = 'u4qn7m2s',
    TRANSACTIONS_DELETE_QUERY = 'e9wf5t3h',

    // Assets
    ASSETS_DB_CLIENT = 'd4hw6b9s',
    ASSETS_GET_ALL_QUERY = 'g9tm1f7p',
    ASSETS_UPDATE_TICKERS_IS_BOT = 'r6ym8k3t',
    ASSETS_UPDATE_TICKERS_FAILED = 'c2sn5v9h',
    ASSETS_CREATE_QUERY = 'z6kb2r8v',
    ASSETS_IMAGE_UPLOAD = 'k3fh9w4m',
    ASSETS_UPDATE_QUERY = 'p7dj2x5r',
    ASSETS_DELETE_QUERY = 'v4tm8c6q',
    ASSETS_LOGO_FETCH = 'q8xw2n5j',

    // Bank (Enable Banking)
    BANK_DB_CLIENT = 'h6tz3m9w',
    BANK_GET_QUERY = 'a8kv5r2n',
    BANK_UPDATE_QUERY = 's3jd7p4x',
    BANK_NOT_CONFIGURED = 'l9cf2w6t',
    BANK_INVALID_STATE = 'e5nq8b3k',
    BANK_NO_ACCOUNT = 'o2xr6h9d',
    BANK_AUTH_REQUEST = 'i7mw4s8f',
    BANK_SESSION_REQUEST = 'y4gb9t2p',
    BANK_BALANCES_REQUEST = 'u9hk3c7m',
    BANK_SYNC_UNAUTHORIZED = 'n3vp8j5z',

    // Cache (dev tools)
    CACHE_REVALIDATE_DEV_ONLY = 'f4rw9k2t',

    // Logs
    LOGS_DB_CLIENT = 'w5fk8r2c',
    LOGS_GET_QUERY = 'j2tb6x9q',
}
