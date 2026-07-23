CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT,
    pays TEXT DEFAULT 'Togo',
    region TEXT,
    ville TEXT,
    contract_types TEXT,
    description TEXT,
    date_posted TEXT,
    date_expiry TEXT,
    source_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_pays ON jobs(pays);
CREATE INDEX IF NOT EXISTS idx_jobs_contract ON jobs(contract_types);
