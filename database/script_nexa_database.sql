-- =============================================================================
-- NEXA - SISTEMA DE GESTÃO DE PROJETOS E COLABORADORES
-- Modelagem de Banco de Dados - PostgreSQL
-- Engenharia de Banco de Dados | Versão 2.1 — Compatível com PostgreSQL 18
-- =============================================================================
-- Contempla: Controle de Acesso (RBAC + RLS), Criptografia, Auditoria,
--            Monitoramento e Estratégia de Backup & Recuperação
-- =============================================================================
-- ALTERAÇÕES v2.0 → v2.1 (compatibilidade PostgreSQL 18):
--   1. sla_deadline: GENERATED ALWAYS substituído por trigger (fn_set_sla_deadline)
--      Motivo: PG18 não permite GENERATED ALWAYS com colunas TIMESTAMPTZ+DEFAULT NOW()
--   2. projects_client_is_cliente: CHECK com subconsulta substituída por trigger
--      Motivo: PostgreSQL não permite subconsultas em CHECK constraints
--   3. projects_select (RLS): alias explícito para evitar ambiguidade de referência
-- =============================================================================

-- =============================================================================
-- SEÇÃO 0: CONFIGURAÇÕES INICIAIS E EXTENSÕES
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- SEÇÃO 1: SCHEMAS
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS nexa;
CREATE SCHEMA IF NOT EXISTS audit;
CREATE SCHEMA IF NOT EXISTS monitoring;

SET search_path = nexa, public;

-- =============================================================================
-- SEÇÃO 2: TIPOS ENUMERADOS (ENUMS)
-- =============================================================================

CREATE TYPE nexa.user_role AS ENUM (
    'NIVEL_1',
    'NIVEL_2',
    'NIVEL_3',
    'PROFESSOR',
    'CLIENTE'
);

CREATE TYPE nexa.project_status AS ENUM (
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE nexa.demand_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'REVIEW',
    'COMPLETED'
);

CREATE TYPE nexa.demand_subfolder AS ENUM (
    'front',
    'back',
    'bd',
    'imgs',
    'git',
    'commits',
    'zip',
    'referencias',
    'contratos'
);

CREATE TYPE nexa.contract_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);

CREATE TYPE nexa.ticket_status AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);

CREATE TYPE nexa.financial_type AS ENUM (
    'PAYABLE',
    'RECEIVABLE'
);

CREATE TYPE nexa.financial_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);

CREATE TYPE nexa.notification_type AS ENUM (
    'CONTRACT_PENDING_SIGNATURE',
    'TICKET_ASSIGNED',
    'TICKET_RESPONSE',
    'SLA_WARNING',
    'SLA_BREACH',
    'DEMAND_ASSIGNED',
    'PROJECT_STATUS_CHANGED',
    'PROFESSOR_COMMENT'
);

CREATE TYPE audit.audit_action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'SELECT',
    'LOGIN',
    'LOGOUT',
    'LOGIN_FAILED',
    'PERMISSION_DENIED'
);

-- =============================================================================
-- SEÇÃO 3: TABELAS PRINCIPAIS
-- =============================================================================

-- 3.1 USUÁRIOS
CREATE TABLE nexa.users (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    email               VARCHAR(255)    NOT NULL,
    password_hash       TEXT            NOT NULL,
    name                VARCHAR(255)    NOT NULL,
    role                nexa.user_role  NOT NULL,
    avatar_url          TEXT,
    cpf_cnpj_encrypted  BYTEA,
    cpf_cnpj_hash       VARCHAR(64)     UNIQUE,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at       TIMESTAMPTZ,
    failed_login_count  SMALLINT        NOT NULL DEFAULT 0,
    locked_until        TIMESTAMPTZ,
    reset_token_hash    VARCHAR(64),
    reset_token_expires TIMESTAMPTZ,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT users_email_unique           UNIQUE (email),
    CONSTRAINT users_email_format           CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
    CONSTRAINT users_failed_logins_positive CHECK (failed_login_count >= 0)
);

-- 3.2 SESSÕES DE AUTENTICAÇÃO
CREATE TABLE nexa.user_sessions (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID        NOT NULL REFERENCES nexa.users(id) ON DELETE CASCADE,
    refresh_token_hash  VARCHAR(64) NOT NULL UNIQUE,
    ip_address          INET        NOT NULL,
    user_agent          TEXT,
    expires_at          TIMESTAMPTZ NOT NULL,
    is_revoked          BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 PROJETOS
-- NOTA v2.1: constraint projects_client_is_cliente removida (PG não suporta
-- subconsultas em CHECK). Validação feita via trigger trg_validate_project_client.
CREATE TABLE nexa.projects (
    id          UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(255)        NOT NULL,
    description TEXT,
    deadline    TIMESTAMPTZ         NOT NULL,
    status      nexa.project_status NOT NULL DEFAULT 'ACTIVE',
    owner_id    UUID                NOT NULL REFERENCES nexa.users(id),
    client_id   UUID                REFERENCES nexa.users(id),
    created_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- 3.4 MEMBROS DO PROJETO
CREATE TABLE nexa.project_members (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID        NOT NULL REFERENCES nexa.projects(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES nexa.users(id)    ON DELETE CASCADE,
    assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    productivity NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    progress     NUMERIC(5,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT project_members_unique             UNIQUE (project_id, user_id),
    CONSTRAINT project_members_productivity_range CHECK (productivity BETWEEN 0 AND 100),
    CONSTRAINT project_members_progress_range     CHECK (progress     BETWEEN 0 AND 100)
);

-- 3.5 DEMANDAS
CREATE TABLE nexa.demands (
    id          UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id  UUID               NOT NULL REFERENCES nexa.projects(id) ON DELETE CASCADE,
    title       VARCHAR(255)       NOT NULL,
    description TEXT,
    deadline    TIMESTAMPTZ        NOT NULL,
    status      nexa.demand_status NOT NULL DEFAULT 'PENDING',
    created_by  UUID               NOT NULL REFERENCES nexa.users(id),
    created_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- 3.6 ARQUIVOS DE DEMANDA
CREATE TABLE nexa.demand_files (
    id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id       UUID                  REFERENCES nexa.demands(id) ON DELETE CASCADE,
    project_id      UUID                  REFERENCES nexa.projects(id) ON DELETE CASCADE,
    subfolder       nexa.demand_subfolder NOT NULL,
    file_name       VARCHAR(500)          NOT NULL,
    file_key        TEXT                  NOT NULL UNIQUE,
    file_size_bytes BIGINT                NOT NULL,
    mime_type       VARCHAR(255)          NOT NULL,
    uploaded_by     UUID                  NOT NULL REFERENCES nexa.users(id),
    created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

    CONSTRAINT demand_files_zip_only     CHECK (subfolder != 'zip' OR mime_type = 'application/zip'),
    CONSTRAINT demand_files_size_positive CHECK (file_size_bytes > 0),
    CONSTRAINT file_belongs_to_either     CHECK (project_id IS NOT NULL OR demand_id IS NOT NULL)
);

-- 3.7 CONTRATOS
CREATE TABLE nexa.contracts (
    id           UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID                  NOT NULL REFERENCES nexa.projects(id) ON DELETE CASCADE,
    title        VARCHAR(255)          NOT NULL,
    content      TEXT                  NOT NULL,
    content_hash VARCHAR(64)           NOT NULL,
    status       nexa.contract_status  NOT NULL DEFAULT 'PENDING',
    created_by   UUID                  NOT NULL REFERENCES nexa.users(id),
    created_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),

    CONSTRAINT contracts_hash_length CHECK (length(content_hash) = 64)
);

-- 3.8 ASSINATURAS DE CONTRATO
CREATE TABLE nexa.contract_signatures (
    id                   UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id          UUID        NOT NULL REFERENCES nexa.contracts(id),
    user_id              UUID        NOT NULL REFERENCES nexa.users(id),
    signature_image      TEXT,
    ip_address           INET        NOT NULL,
    content_hash_at_sign VARCHAR(64) NOT NULL,
    signed_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT contract_signatures_unique      UNIQUE (contract_id, user_id),
    CONSTRAINT contract_signatures_hash_length CHECK (length(content_hash_at_sign) = 64)
);

-- 3.9 CHAMADOS
-- NOTA v2.1: sla_deadline declarada como TIMESTAMPTZ NOT NULL (preenchida por trigger).
-- GENERATED ALWAYS AS (created_at + INTERVAL '3 days') não é suportado no PG18
-- com colunas TIMESTAMPTZ que usam DEFAULT NOW().
CREATE TABLE nexa.tickets (
    id           UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id   UUID               REFERENCES nexa.projects(id),
    creator_id   UUID               NOT NULL REFERENCES nexa.users(id),
    subject      VARCHAR(500)       NOT NULL,
    description  TEXT               NOT NULL,
    status       nexa.ticket_status NOT NULL DEFAULT 'OPEN',
    sla_deadline TIMESTAMPTZ        NOT NULL,  -- preenchido por trg_set_sla_deadline
    created_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- 3.10 RESPOSTAS DE CHAMADOS
CREATE TABLE nexa.ticket_responses (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id  UUID        NOT NULL REFERENCES nexa.tickets(id) ON DELETE CASCADE,
    author_id  UUID        NOT NULL REFERENCES nexa.users(id),
    message    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.11 LANÇAMENTOS FINANCEIROS
CREATE TABLE nexa.financial_entries (
    id           UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
    type         nexa.financial_type   NOT NULL,
    description  VARCHAR(500)          NOT NULL,
    amount_cents BIGINT                NOT NULL,
    due_date     DATE                  NOT NULL,
    status       nexa.financial_status NOT NULL DEFAULT 'PENDING',
    category     VARCHAR(100),
    project_id   UUID                  REFERENCES nexa.projects(id),
    created_by   UUID                  NOT NULL REFERENCES nexa.users(id),
    created_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    paid_at      TIMESTAMPTZ,
    paid_by      UUID                  REFERENCES nexa.users(id),

    CONSTRAINT financial_entries_amount_positive  CHECK (amount_cents > 0),
    CONSTRAINT financial_paid_at_consistency CHECK (
        (status = 'PAID' AND paid_at IS NOT NULL) OR
        (status != 'PAID' AND paid_at IS NULL)
    )
);

-- 3.12 COMENTÁRIOS DO PROFESSOR
CREATE TABLE nexa.professor_comments (
    id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_id  UUID        NOT NULL REFERENCES nexa.users(id),
    author_id  UUID        NOT NULL REFERENCES nexa.users(id),
    comment    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT professor_comments_no_self CHECK (target_id != author_id)
);

-- 3.13 METAS DE RENTABILIDADE
CREATE TABLE nexa.profitability_goals (
    id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID        NOT NULL REFERENCES nexa.users(id) ON DELETE CASCADE,
    month        CHAR(7)     NOT NULL,
    target_cents BIGINT      NOT NULL,
    actual_cents BIGINT      NOT NULL DEFAULT 0,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT profitability_goals_unique_month  UNIQUE (user_id, month),
    CONSTRAINT profitability_goals_month_format  CHECK (month ~ '^\d{4}-\d{2}$'),
    CONSTRAINT profitability_goals_target_positive CHECK (target_cents > 0),
    CONSTRAINT profitability_goals_actual_positive CHECK (actual_cents >= 0)
);

-- =============================================================================
-- SEÇÃO 3-B: TABELAS COMPLEMENTARES
-- =============================================================================

-- 3.14 RESPONSÁVEIS POR DEMANDA
CREATE TABLE nexa.demand_assignees (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id   UUID        NOT NULL REFERENCES nexa.demands(id) ON DELETE CASCADE,
    user_id     UUID        NOT NULL REFERENCES nexa.users(id)   ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID        NOT NULL REFERENCES nexa.users(id),

    CONSTRAINT demand_assignees_unique UNIQUE (demand_id, user_id)
);

CREATE INDEX idx_demand_assignees_demand ON nexa.demand_assignees(demand_id);
CREATE INDEX idx_demand_assignees_user   ON nexa.demand_assignees(user_id);

ALTER TABLE nexa.demand_assignees ENABLE ROW LEVEL SECURITY;
CREATE POLICY demand_assignees_select ON nexa.demand_assignees FOR SELECT TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) IN ('NIVEL_2', 'NIVEL_3', 'PROFESSOR')
    OR user_id::TEXT = current_setting('app.current_user_id', TRUE)
);

-- 3.15 VERSÕES DE CONTRATO
CREATE TABLE nexa.contract_versions (
    id             UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id    UUID        NOT NULL REFERENCES nexa.contracts(id) ON DELETE CASCADE,
    version_number SMALLINT    NOT NULL,
    content        TEXT        NOT NULL,
    content_hash   VARCHAR(64) NOT NULL,
    created_by     UUID        NOT NULL REFERENCES nexa.users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT contract_versions_unique   UNIQUE (contract_id, version_number),
    CONSTRAINT contract_versions_hash_len CHECK (length(content_hash) = 64)
);

CREATE INDEX idx_contract_versions_contract ON nexa.contract_versions(contract_id);

-- 3.16 NOTIFICAÇÕES
CREATE TABLE nexa.notifications (
    id            UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID                   NOT NULL REFERENCES nexa.users(id) ON DELETE CASCADE,
    type          nexa.notification_type NOT NULL,
    title         VARCHAR(255)           NOT NULL,
    body          TEXT,
    related_table VARCHAR(100),
    related_id    UUID,
    is_read       BOOLEAN                NOT NULL DEFAULT FALSE,
    read_at       TIMESTAMPTZ,
    created_at    TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user   ON nexa.notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_unread ON nexa.notifications(user_id) WHERE is_read = FALSE;

ALTER TABLE nexa.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON nexa.notifications FOR SELECT TO nexa_app_role
USING (user_id::TEXT = current_setting('app.current_user_id', TRUE));

CREATE POLICY notifications_update ON nexa.notifications FOR UPDATE TO nexa_app_role
USING (user_id::TEXT = current_setting('app.current_user_id', TRUE));

-- =============================================================================
-- SEÇÃO 4: AUDITORIA
-- =============================================================================

CREATE TABLE audit.audit_logs (
    id          BIGSERIAL           NOT NULL,
    occurred_at TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
    user_id     UUID,
    user_email  VARCHAR(255),
    user_role   TEXT,
    ip_address  INET,
    user_agent  TEXT,
    action      audit.audit_action  NOT NULL,
    schema_name VARCHAR(100),
    table_name  VARCHAR(100),
    record_id   TEXT,
    old_values  JSONB,
    new_values  JSONB,
    context     JSONB,
    success     BOOLEAN             NOT NULL DEFAULT TRUE,
    error_message TEXT,
    PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE TABLE audit.audit_logs_default PARTITION OF audit.audit_logs DEFAULT;

-- =============================================================================
-- SEÇÃO 5: MONITORAMENTO
-- =============================================================================

CREATE TABLE monitoring.slow_query_log (
    id            BIGSERIAL   PRIMARY KEY,
    logged_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    query_text    TEXT        NOT NULL,
    duration_ms   NUMERIC     NOT NULL,
    user_name     TEXT,
    database_name TEXT,
    rows_examined BIGINT
);

CREATE TABLE monitoring.sla_alerts (
    id           BIGSERIAL   PRIMARY KEY,
    ticket_id    UUID        NOT NULL REFERENCES nexa.tickets(id),
    alert_type   TEXT        NOT NULL CHECK (alert_type IN ('SLA_WARNING', 'SLA_BREACH')),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notified     BOOLEAN     NOT NULL DEFAULT FALSE,

    CONSTRAINT sla_alerts_unique UNIQUE (ticket_id, alert_type)
);

CREATE TABLE monitoring.backup_log (
    id            BIGSERIAL   PRIMARY KEY,
    started_at    TIMESTAMPTZ NOT NULL,
    completed_at  TIMESTAMPTZ,
    backup_type   TEXT        NOT NULL,
    destination   TEXT        NOT NULL,
    size_bytes    BIGINT,
    success       BOOLEAN     NOT NULL DEFAULT FALSE,
    error_message TEXT,
    duration_secs NUMERIC GENERATED ALWAYS AS (
        EXTRACT(EPOCH FROM (completed_at - started_at))
    ) STORED
);

-- =============================================================================
-- SEÇÃO 6: ÍNDICES DE PERFORMANCE
-- =============================================================================

CREATE INDEX idx_users_role          ON nexa.users(role);
CREATE INDEX idx_users_cpf_cnpj_hash ON nexa.users(cpf_cnpj_hash) WHERE cpf_cnpj_hash IS NOT NULL;
CREATE INDEX idx_users_active        ON nexa.users(is_active) WHERE is_active = TRUE;

CREATE INDEX idx_sessions_user_id    ON nexa.user_sessions(user_id);
CREATE INDEX idx_sessions_expires    ON nexa.user_sessions(expires_at) WHERE is_revoked = FALSE;
CREATE INDEX idx_sessions_user_active ON nexa.user_sessions(user_id, is_revoked, expires_at)
    WHERE is_revoked = FALSE;

CREATE INDEX idx_projects_owner      ON nexa.projects(owner_id);
CREATE INDEX idx_projects_client     ON nexa.projects(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_projects_status     ON nexa.projects(status);
CREATE INDEX idx_projects_deadline   ON nexa.projects(deadline);

CREATE INDEX idx_project_members_project ON nexa.project_members(project_id);
CREATE INDEX idx_project_members_user    ON nexa.project_members(user_id);

CREATE INDEX idx_demands_project     ON nexa.demands(project_id);
CREATE INDEX idx_demands_status      ON nexa.demands(status);
CREATE INDEX idx_demands_deadline    ON nexa.demands(deadline);
CREATE INDEX idx_demands_title_trgm  ON nexa.demands USING gin(title gin_trgm_ops);
CREATE INDEX idx_demands_desc_trgm   ON nexa.demands USING gin(description gin_trgm_ops);

CREATE INDEX idx_demand_files_demand    ON nexa.demand_files(demand_id);
CREATE INDEX idx_demand_files_project   ON nexa.demand_files(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_demand_files_subfolder ON nexa.demand_files(subfolder);

CREATE INDEX idx_contracts_project   ON nexa.contracts(project_id);
CREATE INDEX idx_contracts_status    ON nexa.contracts(status);

CREATE INDEX idx_tickets_creator     ON nexa.tickets(creator_id);
CREATE INDEX idx_tickets_project     ON nexa.tickets(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_tickets_status      ON nexa.tickets(status);
CREATE INDEX idx_tickets_sla         ON nexa.tickets(sla_deadline) WHERE status IN ('OPEN','IN_PROGRESS');

CREATE INDEX idx_financial_type      ON nexa.financial_entries(type);
CREATE INDEX idx_financial_status    ON nexa.financial_entries(status);
CREATE INDEX idx_financial_due_date  ON nexa.financial_entries(due_date);
CREATE INDEX idx_financial_project   ON nexa.financial_entries(project_id) WHERE project_id IS NOT NULL;

CREATE INDEX idx_audit_occurred_at   ON audit.audit_logs(occurred_at DESC);
CREATE INDEX idx_audit_user_id       ON audit.audit_logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_user_date     ON audit.audit_logs(user_id, occurred_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_table_action  ON audit.audit_logs(table_name, action, occurred_at DESC);
CREATE INDEX idx_audit_table         ON audit.audit_logs(table_name, schema_name);
CREATE INDEX idx_audit_action        ON audit.audit_logs(action);

-- =============================================================================
-- SEÇÃO 7: FUNÇÕES E TRIGGERS DE AUDITORIA
-- =============================================================================

CREATE OR REPLACE FUNCTION audit.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = audit, nexa
AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_action     audit.audit_action;
    v_record_id  TEXT;
BEGIN
    IF    TG_OP = 'INSERT' THEN v_action := 'INSERT';
    ELSIF TG_OP = 'UPDATE' THEN v_action := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN v_action := 'DELETE';
    END IF;

    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        v_old_values := to_jsonb(OLD) - 'password_hash' - 'cpf_cnpj_encrypted'
                                      - 'reset_token_hash' - 'refresh_token_hash';
        v_record_id  := OLD.id::TEXT;
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        v_new_values := to_jsonb(NEW) - 'password_hash' - 'cpf_cnpj_encrypted'
                                      - 'reset_token_hash' - 'refresh_token_hash';
        v_record_id  := NEW.id::TEXT;
    END IF;

    INSERT INTO audit.audit_logs (
        user_id, action, schema_name, table_name,
        record_id, old_values, new_values, context
    ) VALUES (
        current_setting('app.current_user_id', TRUE)::UUID,
        v_action,
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        v_record_id,
        v_old_values,
        v_new_values,
        jsonb_build_object('trigger', TG_NAME)
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION audit.enable_audit(p_schema TEXT, p_table TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_audit_%2$s
         AFTER INSERT OR UPDATE OR DELETE ON %1$I.%2$I
         FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger()',
        p_schema, p_table
    );
END;
$$;

SELECT audit.enable_audit('nexa', 'users');
SELECT audit.enable_audit('nexa', 'projects');
SELECT audit.enable_audit('nexa', 'contracts');
SELECT audit.enable_audit('nexa', 'contract_signatures');
SELECT audit.enable_audit('nexa', 'financial_entries');
SELECT audit.enable_audit('nexa', 'tickets');
SELECT audit.enable_audit('nexa', 'project_members');

-- =============================================================================
-- SEÇÃO 8: TRIGGER updated_at AUTOMÁTICO
-- =============================================================================

CREATE OR REPLACE FUNCTION nexa.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY[
        'users','projects','demands','contracts',
        'tickets','financial_entries',
        'professor_comments','profitability_goals'
    ] LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_updated_at_%1$s
             BEFORE UPDATE ON nexa.%1$I
             FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at()',
            t
        );
    END LOOP;
END;
$$;

-- =============================================================================
-- SEÇÃO 9: TRIGGERS DE VALIDAÇÃO DE REGRAS DE NEGÓCIO
-- =============================================================================

-- Valida que comentários só são feitos por PROFESSOR sobre NIVEL_1/NIVEL_2
CREATE OR REPLACE FUNCTION nexa.fn_validate_professor_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_author_role nexa.user_role;
    v_target_role nexa.user_role;
BEGIN
    SELECT role INTO v_author_role FROM nexa.users WHERE id = NEW.author_id;
    SELECT role INTO v_target_role FROM nexa.users WHERE id = NEW.target_id;

    IF v_author_role != 'PROFESSOR' THEN
        RAISE EXCEPTION 'Apenas PROFESSOR pode criar comentários de avaliação. Role atual: %', v_author_role;
    END IF;

    IF v_target_role NOT IN ('NIVEL_1', 'NIVEL_2') THEN
        RAISE EXCEPTION 'Comentários só podem ser feitos sobre estagiários (NIVEL_1 ou NIVEL_2). Role do alvo: %', v_target_role;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_professor_comment
BEFORE INSERT OR UPDATE ON nexa.professor_comments
FOR EACH ROW EXECUTE FUNCTION nexa.fn_validate_professor_comment();

-- Bloqueia UPDATE/DELETE em contract_signatures (imutável)
CREATE OR REPLACE FUNCTION nexa.fn_block_signature_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Assinaturas de contrato são imutáveis e não podem ser alteradas ou excluídas.';
END;
$$;

CREATE TRIGGER trg_block_signature_update
BEFORE UPDATE OR DELETE ON nexa.contract_signatures
FOR EACH ROW EXECUTE FUNCTION nexa.fn_block_signature_update();

-- Versões de contrato também são imutáveis
CREATE TRIGGER trg_block_version_update
BEFORE UPDATE OR DELETE ON nexa.contract_versions
FOR EACH ROW EXECUTE FUNCTION nexa.fn_block_signature_update();

-- NOTA v2.1: sla_deadline preenchido por trigger em vez de GENERATED ALWAYS
-- Motivo: PG18 rejeita GENERATED ALWAYS com expressões não imutáveis
CREATE OR REPLACE FUNCTION nexa.fn_set_sla_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.sla_deadline := NEW.created_at + INTERVAL '3 days';
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_sla_deadline
BEFORE INSERT ON nexa.tickets
FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_sla_deadline();

-- Alerta de SLA
CREATE OR REPLACE FUNCTION nexa.fn_check_ticket_sla()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.status IN ('OPEN', 'IN_PROGRESS') AND
       NEW.sla_deadline <= NOW() + INTERVAL '6 hours' AND
       NEW.sla_deadline > NOW() THEN
        INSERT INTO monitoring.sla_alerts (ticket_id, alert_type)
        VALUES (NEW.id, 'SLA_WARNING')
        ON CONFLICT DO NOTHING;
    END IF;

    IF NEW.status = 'OPEN' AND NEW.sla_deadline <= NOW() THEN
        INSERT INTO monitoring.sla_alerts (ticket_id, alert_type)
        VALUES (NEW.id, 'SLA_BREACH')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_sla
AFTER INSERT OR UPDATE ON nexa.tickets
FOR EACH ROW EXECUTE FUNCTION nexa.fn_check_ticket_sla();

-- NOTA v2.1: validação de client_id via trigger (CHECK com subconsulta não é
-- suportado pelo PostgreSQL)
CREATE OR REPLACE FUNCTION nexa.fn_validate_project_client()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_role nexa.user_role;
BEGIN
    IF NEW.client_id IS NOT NULL THEN
        SELECT role INTO v_role
        FROM   nexa.users
        WHERE  id = NEW.client_id;

        IF v_role IS NULL THEN
            RAISE EXCEPTION 'client_id "%" não existe na tabela users.', NEW.client_id;
        END IF;

        IF v_role != 'CLIENTE' THEN
            RAISE EXCEPTION
                'O usuário informado em client_id deve ter role CLIENTE. Role atual: %',
                v_role;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_project_client
BEFORE INSERT OR UPDATE ON nexa.projects
FOR EACH ROW EXECUTE FUNCTION nexa.fn_validate_project_client();

-- Versões de contrato: incrementa version_number automaticamente
CREATE OR REPLACE FUNCTION nexa.fn_set_contract_version()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE v_next SMALLINT;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO   v_next
    FROM   nexa.contract_versions
    WHERE  contract_id = NEW.contract_id;

    NEW.version_number := v_next;
    NEW.content_hash   := nexa.fn_contract_content_hash(NEW.content);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_contract_version
BEFORE INSERT ON nexa.contract_versions
FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_contract_version();

-- =============================================================================
-- SEÇÃO 10: CONTROLE DE ACESSO (RBAC)
-- =============================================================================

CREATE ROLE nexa_app_role  NOLOGIN;
CREATE ROLE nexa_readonly  NOLOGIN;
CREATE ROLE nexa_auditor   NOLOGIN;
CREATE ROLE nexa_dba       NOLOGIN;

CREATE ROLE nexa_app LOGIN
    PASSWORD 'TROCAR_EM_PRODUCAO_USE_VAULT'
    CONNECTION LIMIT 50
    IN ROLE nexa_app_role;

CREATE ROLE nexa_auditor_user LOGIN
    PASSWORD 'TROCAR_EM_PRODUCAO_USE_VAULT'
    CONNECTION LIMIT 5
    IN ROLE nexa_auditor;

GRANT USAGE ON SCHEMA nexa TO nexa_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA nexa TO nexa_app_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA nexa TO nexa_app_role;

GRANT USAGE ON SCHEMA audit TO nexa_app_role;
GRANT INSERT ON audit.audit_logs TO nexa_app_role;

GRANT USAGE ON SCHEMA monitoring TO nexa_app_role;
GRANT INSERT, SELECT ON ALL TABLES IN SCHEMA monitoring TO nexa_app_role;

GRANT USAGE ON SCHEMA nexa TO nexa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA nexa TO nexa_readonly;

GRANT USAGE ON SCHEMA audit     TO nexa_auditor;
GRANT USAGE ON SCHEMA monitoring TO nexa_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA audit      TO nexa_auditor;
GRANT SELECT ON ALL TABLES IN SCHEMA monitoring TO nexa_auditor;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA nexa   FROM PUBLIC;
REVOKE ALL ON SCHEMA audit  FROM PUBLIC;

-- =============================================================================
-- SEÇÃO 11: ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE nexa.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.projects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.project_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.demands             ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.contracts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.tickets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.financial_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.professor_comments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexa.profitability_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_logs         ENABLE ROW LEVEL SECURITY;

ALTER TABLE nexa.users               FORCE ROW LEVEL SECURITY;
ALTER TABLE nexa.financial_entries   FORCE ROW LEVEL SECURITY;
ALTER TABLE nexa.contract_signatures FORCE ROW LEVEL SECURITY;
ALTER TABLE audit.audit_logs         FORCE ROW LEVEL SECURITY;

-- users
CREATE POLICY users_select ON nexa.users FOR SELECT TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) = 'NIVEL_3'
    OR id::TEXT = current_setting('app.current_user_id', TRUE)
    OR (current_setting('app.current_user_role', TRUE) = 'PROFESSOR'
        AND role IN ('NIVEL_1', 'NIVEL_2'))
);

CREATE POLICY users_insert ON nexa.users FOR INSERT TO nexa_app_role
WITH CHECK (current_setting('app.current_user_role', TRUE) = 'NIVEL_3');

CREATE POLICY users_update ON nexa.users FOR UPDATE TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) = 'NIVEL_3'
    OR id::TEXT = current_setting('app.current_user_id', TRUE)
);

-- projects
-- NOTA v2.1: alias explícito (nexa.projects.id) necessário para evitar ambiguidade
-- no PostgreSQL 18 ao referenciar a tabela-alvo da policy dentro de subconsulta
CREATE POLICY projects_select ON nexa.projects FOR SELECT TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) IN ('NIVEL_3', 'PROFESSOR')
    OR (current_setting('app.current_user_role', TRUE) = 'CLIENTE'
        AND client_id::TEXT = current_setting('app.current_user_id', TRUE))
    OR EXISTS (
        SELECT 1
        FROM nexa.project_members pm
        JOIN nexa.projects proj ON proj.id = pm.project_id
        WHERE proj.id = nexa.projects.id
          AND pm.user_id::TEXT = current_setting('app.current_user_id', TRUE)
    )
);

CREATE POLICY projects_insert ON nexa.projects FOR INSERT TO nexa_app_role
WITH CHECK (
    current_setting('app.current_user_role', TRUE) IN ('NIVEL_2', 'NIVEL_3')
    AND owner_id::TEXT = current_setting('app.current_user_id', TRUE)
);

-- contracts
CREATE POLICY contracts_select ON nexa.contracts FOR SELECT TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) IN ('NIVEL_2', 'NIVEL_3', 'PROFESSOR')
    OR EXISTS (
        SELECT 1 FROM nexa.projects p
        WHERE p.id = project_id
          AND p.client_id::TEXT = current_setting('app.current_user_id', TRUE)
    )
);

-- financial_entries
CREATE POLICY financial_select ON nexa.financial_entries FOR SELECT TO nexa_app_role
USING (current_setting('app.current_user_role', TRUE) = 'NIVEL_3');

CREATE POLICY financial_insert ON nexa.financial_entries FOR INSERT TO nexa_app_role
WITH CHECK (current_setting('app.current_user_role', TRUE) = 'NIVEL_3');

CREATE POLICY financial_update ON nexa.financial_entries FOR UPDATE TO nexa_app_role
USING (current_setting('app.current_user_role', TRUE) = 'NIVEL_3');

-- tickets
CREATE POLICY tickets_select ON nexa.tickets FOR SELECT TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) IN ('NIVEL_2', 'NIVEL_3')
    OR creator_id::TEXT = current_setting('app.current_user_id', TRUE)
);

CREATE POLICY tickets_insert ON nexa.tickets FOR INSERT TO nexa_app_role
WITH CHECK (TRUE);

-- audit_logs
CREATE POLICY audit_insert ON audit.audit_logs FOR INSERT TO nexa_app_role
WITH CHECK (TRUE);

CREATE POLICY audit_select ON audit.audit_logs FOR SELECT TO nexa_auditor
USING (TRUE);

-- profitability_goals
CREATE POLICY goals_select ON nexa.profitability_goals FOR SELECT TO nexa_app_role
USING (
    current_setting('app.current_user_role', TRUE) = 'NIVEL_3'
    OR user_id::TEXT = current_setting('app.current_user_id', TRUE)
);

-- Políticas de DELETE explícitas
CREATE POLICY tickets_delete ON nexa.tickets FOR DELETE TO nexa_app_role
USING (current_setting('app.current_user_role', TRUE) = 'NIVEL_3');

CREATE POLICY demands_delete ON nexa.demands FOR DELETE TO nexa_app_role
USING (current_setting('app.current_user_role', TRUE) = 'NIVEL_3');

CREATE POLICY signatures_no_delete ON nexa.contract_signatures FOR DELETE TO nexa_app_role
USING (FALSE);

CREATE POLICY audit_no_delete ON audit.audit_logs FOR DELETE TO nexa_app_role
USING (FALSE);

CREATE POLICY audit_no_update ON audit.audit_logs FOR UPDATE TO nexa_app_role
USING (FALSE);

-- =============================================================================
-- SEÇÃO 12: VIEWS SEGURAS
-- =============================================================================

CREATE OR REPLACE VIEW nexa.vw_users_public AS
SELECT id, name, email, role, avatar_url, is_active, last_login_at, created_at
FROM nexa.users;

CREATE OR REPLACE VIEW nexa.vw_financial_summary
    WITH (security_barrier = true)
AS
SELECT
    DATE_TRUNC('month', due_date) AS month,
    type,
    status,
    SUM(amount_cents) / 100.0     AS total_amount,
    COUNT(*)                       AS entry_count
FROM nexa.financial_entries
GROUP BY 1, 2, 3;

CREATE OR REPLACE VIEW nexa.vw_team_productivity AS
SELECT
    u.id          AS user_id,
    u.name,
    u.role,
    p.id          AS project_id,
    p.name        AS project_name,
    pm.productivity,
    pm.progress,
    pm.assigned_at
FROM nexa.project_members pm
JOIN nexa.users    u ON u.id = pm.user_id
JOIN nexa.projects p ON p.id = pm.project_id;

CREATE OR REPLACE VIEW nexa.vw_tickets_sla AS
SELECT
    t.*,
    CASE
        WHEN t.sla_deadline < NOW() AND t.status IN ('OPEN','IN_PROGRESS') THEN 'BREACHED'
        WHEN t.sla_deadline < NOW() + INTERVAL '6 hours'
             AND t.status IN ('OPEN','IN_PROGRESS') THEN 'WARNING'
        ELSE 'OK'
    END AS sla_status,
    u.name AS creator_name
FROM nexa.tickets t
JOIN nexa.users u ON u.id = t.creator_id;

GRANT SELECT ON nexa.vw_users_public      TO nexa_app_role;
GRANT SELECT ON nexa.vw_financial_summary TO nexa_app_role;
GRANT SELECT ON nexa.vw_team_productivity TO nexa_app_role;
GRANT SELECT ON nexa.vw_tickets_sla       TO nexa_app_role;

-- =============================================================================
-- SEÇÃO 13: FUNÇÕES UTILITÁRIAS DE SEGURANÇA
-- =============================================================================

CREATE OR REPLACE FUNCTION nexa.fn_record_login(
    p_email   TEXT,
    p_success BOOLEAN,
    p_ip      INET,
    p_agent   TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id   UUID;
    v_user_role TEXT;
BEGIN
    SELECT id, role::TEXT INTO v_user_id, v_user_role
    FROM   nexa.users WHERE email = p_email;

    IF v_user_id IS NULL THEN
        INSERT INTO audit.audit_logs (user_id, user_email, ip_address, user_agent, action, success, error_message)
        VALUES (NULL, p_email, p_ip, p_agent, 'LOGIN_FAILED', FALSE, 'Email não encontrado');
        RETURN;
    END IF;

    IF p_success THEN
        UPDATE nexa.users
        SET    failed_login_count = 0,
               last_login_at      = NOW(),
               locked_until       = NULL
        WHERE  id = v_user_id;

        INSERT INTO audit.audit_logs (user_id, user_email, user_role, ip_address, user_agent, action, success)
        VALUES (v_user_id, p_email, v_user_role, p_ip, p_agent, 'LOGIN', TRUE);
    ELSE
        UPDATE nexa.users
        SET    failed_login_count = failed_login_count + 1,
               locked_until = CASE
                   WHEN failed_login_count + 1 >= 10 THEN NOW() + INTERVAL '1 hour'
                   WHEN failed_login_count + 1 >= 5  THEN NOW() + INTERVAL '15 minutes'
                   ELSE NULL
               END
        WHERE  id = v_user_id;

        INSERT INTO audit.audit_logs (user_id, user_email, ip_address, user_agent, action, success, error_message)
        VALUES (v_user_id, p_email, p_ip, p_agent, 'LOGIN_FAILED', FALSE, 'Credenciais inválidas');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION nexa.fn_contract_content_hash(p_content TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE STRICT
AS $$
    SELECT encode(digest(p_content, 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION nexa.fn_set_contract_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.content_hash = nexa.fn_contract_content_hash(NEW.content);
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_contract_hash
BEFORE INSERT OR UPDATE OF content ON nexa.contracts
FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_contract_hash();

CREATE OR REPLACE FUNCTION nexa.fn_decrypt_cpf_cnpj(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_encrypted BYTEA;
    v_role      TEXT;
BEGIN
    v_role := current_setting('app.current_user_role', TRUE);
    IF v_role != 'NIVEL_3' THEN
        RAISE EXCEPTION 'Acesso negado: apenas NIVEL_3 pode acessar CPF/CNPJ descriptografado.';
    END IF;

    SELECT cpf_cnpj_encrypted INTO v_encrypted
    FROM   nexa.users WHERE id = p_user_id;

    IF v_encrypted IS NULL THEN RETURN NULL; END IF;

    INSERT INTO audit.audit_logs (user_id, action, table_name, record_id, context)
    VALUES (
        current_setting('app.current_user_id', TRUE)::UUID,
        'SELECT', 'users', p_user_id::TEXT,
        '{"field": "cpf_cnpj", "reason": "admin_access"}'::JSONB
    );

    RETURN pgp_sym_decrypt(v_encrypted, current_setting('app.crypto_key'));
END;
$$;

REVOKE EXECUTE ON FUNCTION nexa.fn_decrypt_cpf_cnpj(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION nexa.fn_decrypt_cpf_cnpj(UUID) TO nexa_app_role;

-- =============================================================================
-- SEÇÃO 14: CONFIGURAÇÕES DE SEGURANÇA DO POSTGRESQL
-- =============================================================================

ALTER SYSTEM SET log_connections             = 'on';
ALTER SYSTEM SET log_disconnections          = 'on';
ALTER SYSTEM SET log_min_duration_statement  = 500;
ALTER SYSTEM SET log_failed_connections      = 'on';
ALTER SYSTEM SET log_statement               = 'ddl';
ALTER SYSTEM SET statement_timeout           = '30s';
ALTER SYSTEM SET lock_timeout                = '10s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';
ALTER SYSTEM SET shared_preload_libraries    = 'pg_stat_statements';
ALTER SYSTEM SET pg_stat_statements.track    = 'all';

SELECT pg_reload_conf();

-- =============================================================================
-- SEÇÃO 16: BACKUP
-- =============================================================================

CREATE ROLE nexa_backup LOGIN
    PASSWORD 'TROCAR_EM_PRODUCAO_USE_VAULT'
    CONNECTION LIMIT 2
    REPLICATION;

GRANT INSERT, SELECT ON monitoring.backup_log TO nexa_backup;

-- =============================================================================
-- SEÇÃO 18: VERIFICAÇÃO FINAL
-- =============================================================================

SELECT schemaname AS schema, tablename AS tabela, rowsecurity AS rls_ativo
FROM pg_tables
WHERE schemaname IN ('nexa', 'audit', 'monitoring')
ORDER BY schemaname, tablename;

SELECT trigger_schema AS schema, event_object_table AS tabela,
       trigger_name, event_manipulation AS evento, action_timing AS timing
FROM information_schema.triggers
WHERE trigger_schema IN ('nexa', 'audit')
ORDER BY event_object_table, trigger_name;

SELECT schemaname AS schema, tablename AS tabela,
       policyname AS policy, cmd AS operacao, roles
FROM pg_policies
WHERE schemaname IN ('nexa', 'audit')
ORDER BY tablename, cmd;

-- =============================================================================
-- FIM DO SCRIPT — NEXA Database v2.1 (PostgreSQL 18)
-- =============================================================================
