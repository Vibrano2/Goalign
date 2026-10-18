-- SQL Schema for Goalign

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    vip_level INT DEFAULT 0,
    is_admin BOOLEAN DEFAULT false,
    kyc_status VARCHAR(20) DEFAULT 'unverified',
    web3_eth_address VARCHAR(255),
    web3_sol_address VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS balances (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(20) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'spot', -- 'spot', 'futures', 'earn'
    total DECIMAL(30, 8) DEFAULT 0.00000000,
    available DECIMAL(30, 8) DEFAULT 0.00000000,
    locked DECIMAL(30, 8) DEFAULT 0.00000000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, asset, account_type)
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    type VARCHAR(20) NOT NULL, -- 'limit' or 'market'
    price DECIMAL(30, 8) NOT NULL,
    amount DECIMAL(30, 8) NOT NULL,
    filled DECIMAL(30, 8) DEFAULT 0.00000000,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'canceled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,
    price DECIMAL(30, 8) NOT NULL,
    amount DECIMAL(30, 8) NOT NULL,
    fee DECIMAL(30, 8) DEFAULT 0.00000000,
    fee_asset VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_balances_user_id ON balances(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS positions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL, -- 'long' or 'short'
    leverage INT NOT NULL,
    margin DECIMAL(30, 8) NOT NULL,
    entry_price DECIMAL(30, 8) NOT NULL,
    size DECIMAL(30, 8) NOT NULL,
    liquidation_price DECIMAL(30, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'closed', 'liquidated'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);

CREATE TABLE IF NOT EXISTS stakes (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    asset VARCHAR(20) NOT NULL,
    amount DECIMAL(30, 8) NOT NULL,
    apy DECIMAL(10, 4) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'redeemed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    redeemed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_stakes_user_id ON stakes(user_id);
CREATE INDEX IF NOT EXISTS idx_stakes_status ON stakes(status);

CREATE TABLE IF NOT EXISTS p2p_ads (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    asset VARCHAR(20) NOT NULL, -- e.g., 'USDT'
    fiat VARCHAR(10) NOT NULL, -- e.g., 'USD'
    price DECIMAL(30, 8) NOT NULL,
    total_amount DECIMAL(30, 8) NOT NULL,
    available_amount DECIMAL(30, 8) NOT NULL,
    min_limit DECIMAL(30, 8) NOT NULL,
    max_limit DECIMAL(30, 8) NOT NULL,
    payment_methods TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS p2p_orders (
    id SERIAL PRIMARY KEY,
    ad_id INT REFERENCES p2p_ads(id) ON DELETE CASCADE,
    buyer_id INT REFERENCES users(id) ON DELETE SET NULL,
    seller_id INT REFERENCES users(id) ON DELETE SET NULL,
    asset VARCHAR(20) NOT NULL,
    fiat VARCHAR(10) NOT NULL,
    crypto_amount DECIMAL(30, 8) NOT NULL,
    fiat_amount DECIMAL(30, 8) NOT NULL,
    price DECIMAL(30, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'completed', 'cancelled'
    payment_method VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_p2p_ads_status ON p2p_ads(status);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_ad_id ON p2p_orders(ad_id);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_buyer_id ON p2p_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_p2p_orders_seller_id ON p2p_orders(seller_id);

CREATE TABLE IF NOT EXISTS options_positions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'call' or 'put'
    side VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    strike_price DECIMAL(30, 8) NOT NULL,
    premium_paid DECIMAL(30, 8) NOT NULL,
    size DECIMAL(30, 8) NOT NULL,
    expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'exercised', 'expired'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_options_user_id ON options_positions(user_id);

CREATE TABLE IF NOT EXISTS copy_allocations (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    master_name VARCHAR(100) NOT NULL,
    allocated_amount DECIMAL(30, 8) NOT NULL,
    current_value DECIMAL(30, 8) NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'stopped'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_copy_allocations_user_id ON copy_allocations(user_id);

CREATE TABLE IF NOT EXISTS kyc_applications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    id_type VARCHAR(50) DEFAULT 'ID Card',
    id_document_base64 TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
