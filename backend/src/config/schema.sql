CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id VARCHAR(50) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  webhook_secret VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pull_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  github_pr_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  author VARCHAR(100),
  status VARCHAR(30) DEFAULT 'open',
  ai_review_status VARCHAR(20) DEFAULT 'pending',
  ai_review TEXT,
  files_changed INTEGER DEFAULT 0,
  additions INTEGER DEFAULT 0,
  deletions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  github_issue_id INTEGER DEFAULT 0,
  title TEXT NOT NULL,
  body TEXT,
  status VARCHAR(20) DEFAULT 'open',
  priority VARCHAR(20) DEFAULT 'medium',
  assignee VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pr_repo ON pull_requests(repo_id);
CREATE INDEX IF NOT EXISTS idx_pr_status ON pull_requests(status);
CREATE INDEX IF NOT EXISTS idx_issues_repo ON issues(repo_id);

CREATE TABLE IF NOT EXISTS file_churn (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  change_count INTEGER DEFAULT 1,
  last_changed TIMESTAMP DEFAULT NOW(),
  UNIQUE (repo_id, filename)
);

CREATE INDEX IF NOT EXISTS idx_churn_repo ON file_churn(repo_id);

CREATE TABLE IF NOT EXISTS developer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  username VARCHAR(100) NOT NULL,
  personality VARCHAR(50) DEFAULT 'Balanced',
  personality_emoji VARCHAR(10) DEFAULT '⚖️',
  total_prs INTEGER DEFAULT 0,
  avg_risk_score NUMERIC(5,2) DEFAULT 0,
  avg_files_per_pr NUMERIC(5,2) DEFAULT 0,
  avg_additions NUMERIC(8,2) DEFAULT 0,
  docs_prs INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE (repo_id, username)
);

CREATE INDEX IF NOT EXISTS idx_profiles_repo ON developer_profiles(repo_id);
