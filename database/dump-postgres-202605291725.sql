--
-- PostgreSQL database dump
--

\restrict 2FPLaIdvxAXVYBL8O97Zk3cDRIrRTsnJG291DlSap7pp8skYqLybdiJoptNvFpM

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

-- Started on 2026-05-29 17:25:59

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 13 (class 2615 OID 17294)
-- Name: audit; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA audit;


ALTER SCHEMA audit OWNER TO postgres;

--
-- TOC entry 10 (class 2615 OID 17295)
-- Name: monitoring; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA monitoring;


ALTER SCHEMA monitoring OWNER TO postgres;

--
-- TOC entry 12 (class 2615 OID 17293)
-- Name: nexa; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA nexa;


ALTER SCHEMA nexa OWNER TO postgres;

--
-- TOC entry 6 (class 3079 OID 16562)
-- Name: btree_gist; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;


--
-- TOC entry 5870 (class 0 OID 0)
-- Dependencies: 6
-- Name: EXTENSION btree_gist; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION btree_gist IS 'support for indexing common datatypes in GiST';


--
-- TOC entry 4 (class 3079 OID 16437)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA public;


--
-- TOC entry 5871 (class 0 OID 0)
-- Dependencies: 4
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- TOC entry 5 (class 3079 OID 16481)
-- Name: pg_trgm; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA public;


--
-- TOC entry 5872 (class 0 OID 0)
-- Dependencies: 5
-- Name: EXTENSION pg_trgm; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_trgm IS 'text similarity measurement and index searching based on trigrams';


--
-- TOC entry 3 (class 3079 OID 16399)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5873 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 2 (class 3079 OID 16388)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5874 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 1238 (class 1247 OID 17378)
-- Name: audit_action; Type: TYPE; Schema: audit; Owner: postgres
--

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


ALTER TYPE audit.audit_action OWNER TO postgres;

--
-- TOC entry 1226 (class 1247 OID 17344)
-- Name: contract_status; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.contract_status AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE nexa.contract_status OWNER TO postgres;

--
-- TOC entry 1220 (class 1247 OID 17318)
-- Name: demand_status; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.demand_status AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'REVIEW',
    'COMPLETED'
);


ALTER TYPE nexa.demand_status OWNER TO postgres;

--
-- TOC entry 1223 (class 1247 OID 17328)
-- Name: demand_subfolder; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.demand_subfolder AS ENUM (
    'front',
    'back',
    'bd',
    'imgs',
    'git',
    'commits',
    'zip'
);


ALTER TYPE nexa.demand_subfolder OWNER TO postgres;

--
-- TOC entry 1235 (class 1247 OID 17368)
-- Name: financial_status; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.financial_status AS ENUM (
    'PENDING',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);


ALTER TYPE nexa.financial_status OWNER TO postgres;

--
-- TOC entry 1232 (class 1247 OID 17362)
-- Name: financial_type; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.financial_type AS ENUM (
    'PAYABLE',
    'RECEIVABLE'
);


ALTER TYPE nexa.financial_type OWNER TO postgres;

--
-- TOC entry 1286 (class 1247 OID 17922)
-- Name: notification_type; Type: TYPE; Schema: nexa; Owner: postgres
--

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


ALTER TYPE nexa.notification_type OWNER TO postgres;

--
-- TOC entry 1217 (class 1247 OID 17308)
-- Name: project_status; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.project_status AS ENUM (
    'ACTIVE',
    'PAUSED',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE nexa.project_status OWNER TO postgres;

--
-- TOC entry 1229 (class 1247 OID 17352)
-- Name: ticket_status; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.ticket_status AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE nexa.ticket_status OWNER TO postgres;

--
-- TOC entry 1214 (class 1247 OID 17297)
-- Name: user_role; Type: TYPE; Schema: nexa; Owner: postgres
--

CREATE TYPE nexa.user_role AS ENUM (
    'NIVEL_1',
    'NIVEL_2',
    'NIVEL_3',
    'PROFESSOR',
    'CLIENTE'
);


ALTER TYPE nexa.user_role OWNER TO postgres;

--
-- TOC entry 419 (class 1255 OID 18085)
-- Name: enable_audit(text, text); Type: FUNCTION; Schema: audit; Owner: postgres
--

CREATE FUNCTION audit.enable_audit(p_schema text, p_table text) RETURNS void
    LANGUAGE plpgsql
    AS $_$
BEGIN
    EXECUTE format(
        'CREATE TRIGGER trg_audit_%2$s
         AFTER INSERT OR UPDATE OR DELETE ON %1$I.%2$I
         FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger()',
        p_schema, p_table
    );
END;
$_$;


ALTER FUNCTION audit.enable_audit(p_schema text, p_table text) OWNER TO postgres;

--
-- TOC entry 421 (class 1255 OID 18084)
-- Name: fn_audit_trigger(); Type: FUNCTION; Schema: audit; Owner: postgres
--

CREATE FUNCTION audit.fn_audit_trigger() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'audit', 'nexa'
    AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_action     audit.audit_action;
    v_record_id  TEXT;
BEGIN
    -- Determina a ação
    IF    TG_OP = 'INSERT' THEN v_action := 'INSERT';
    ELSIF TG_OP = 'UPDATE' THEN v_action := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN v_action := 'DELETE';
    END IF;

    -- Serializa valores antigos/novos (exclui campos sensíveis)
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

    -- Insere no log de auditoria
    INSERT INTO audit.audit_logs (
        user_id, action, schema_name, table_name,
        record_id, old_values, new_values,
        context
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

    -- CORREÇÃO BUG: Em AFTER FOR EACH ROW triggers o retorno é ignorado pelo executor,
    -- mas a boa prática é retornar NEW (INSERT/UPDATE) ou OLD (DELETE) para clareza
    -- e compatibilidade com versões futuras do PostgreSQL.
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION audit.fn_audit_trigger() OWNER TO postgres;

--
-- TOC entry 462 (class 1255 OID 17914)
-- Name: fn_block_signature_update(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_block_signature_update() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    RAISE EXCEPTION 'Assinaturas de contrato são imutáveis e não podem ser alteradas ou excluídas.';
END;
$$;


ALTER FUNCTION nexa.fn_block_signature_update() OWNER TO postgres;

--
-- TOC entry 396 (class 1255 OID 17916)
-- Name: fn_check_ticket_sla(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_check_ticket_sla() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Alerta 6h antes do vencimento do SLA
    IF NEW.status IN ('OPEN', 'IN_PROGRESS') AND
       NEW.sla_deadline <= NOW() + INTERVAL '6 hours' AND
       NEW.sla_deadline > NOW() THEN
        INSERT INTO monitoring.sla_alerts (ticket_id, alert_type)
        VALUES (NEW.id, 'SLA_WARNING')
        ON CONFLICT DO NOTHING;
    END IF;

    -- Registra breach se venceu sem resposta
    IF NEW.status = 'OPEN' AND NEW.sla_deadline <= NOW() THEN
        INSERT INTO monitoring.sla_alerts (ticket_id, alert_type)
        VALUES (NEW.id, 'SLA_BREACH')
        ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION nexa.fn_check_ticket_sla() OWNER TO postgres;

--
-- TOC entry 266 (class 1255 OID 18140)
-- Name: fn_contract_content_hash(text); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_contract_content_hash(p_content text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
    SELECT encode(digest(p_content, 'sha256'), 'hex');
$$;


ALTER FUNCTION nexa.fn_contract_content_hash(p_content text) OWNER TO postgres;

--
-- TOC entry 552 (class 1255 OID 18143)
-- Name: fn_decrypt_cpf_cnpj(uuid); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_decrypt_cpf_cnpj(p_user_id uuid) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_encrypted BYTEA;
    v_role      TEXT;
BEGIN
    -- Somente NIVEL_3 pode descriptografar
    v_role := current_setting('app.current_user_role', TRUE);
    IF v_role != 'NIVEL_3' THEN
        RAISE EXCEPTION 'Acesso negado: apenas NIVEL_3 pode acessar CPF/CNPJ descriptografado.';
    END IF;

    SELECT cpf_cnpj_encrypted INTO v_encrypted
    FROM   nexa.users WHERE id = p_user_id;

    IF v_encrypted IS NULL THEN RETURN NULL; END IF;

    -- Registra acesso na auditoria
    INSERT INTO audit.audit_logs (
        user_id, action, table_name, record_id, context
    ) VALUES (
        current_setting('app.current_user_id', TRUE)::UUID,
        'SELECT',
        'users',
        p_user_id::TEXT,
        '{"field": "cpf_cnpj", "reason": "admin_access"}'::JSONB
    );

    RETURN pgp_sym_decrypt(v_encrypted, current_setting('app.crypto_key'));
END;
$$;


ALTER FUNCTION nexa.fn_decrypt_cpf_cnpj(p_user_id uuid) OWNER TO postgres;

--
-- TOC entry 307 (class 1255 OID 18139)
-- Name: fn_record_login(text, boolean, inet, text); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_record_login(p_email text, p_success boolean, p_ip inet, p_agent text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_user_id   UUID;
    v_user_role TEXT;
BEGIN
    SELECT id, role::TEXT
    INTO   v_user_id, v_user_role
    FROM   nexa.users
    WHERE  email = p_email;

    -- CORREÇÃO BUG: email inexistente — registra a tentativa com user_id NULL
    -- para rastrear IPs de força bruta em emails inválidos
    IF v_user_id IS NULL THEN
        INSERT INTO audit.audit_logs (user_id, user_email, ip_address, user_agent, action, success, error_message)
        VALUES (NULL, p_email, p_ip, p_agent, 'LOGIN_FAILED', FALSE, 'Email não encontrado');
        RETURN;
    END IF;

    IF p_success THEN
        -- Reseta contador de falhas e registra último login
        UPDATE nexa.users
        SET    failed_login_count = 0,
               last_login_at      = NOW(),
               locked_until       = NULL
        WHERE  id = v_user_id;

        INSERT INTO audit.audit_logs (user_id, user_email, user_role, ip_address, user_agent, action, success)
        VALUES (v_user_id, p_email, v_user_role, p_ip, p_agent, 'LOGIN', TRUE);
    ELSE
        -- Incrementa falhas e bloqueia progressivamente:
        -- >= 5 tentativas → 15 minutos | >= 10 tentativas → 1 hora
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


ALTER FUNCTION nexa.fn_record_login(p_email text, p_success boolean, p_ip inet, p_agent text) OWNER TO postgres;

--
-- TOC entry 487 (class 1255 OID 18141)
-- Name: fn_set_contract_hash(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_set_contract_hash() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.content_hash = nexa.fn_contract_content_hash(NEW.content);
    RETURN NEW;
END;
$$;


ALTER FUNCTION nexa.fn_set_contract_hash() OWNER TO postgres;

--
-- TOC entry 325 (class 1255 OID 17918)
-- Name: fn_set_contract_version(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_set_contract_version() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE v_next SMALLINT;
BEGIN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO   v_next
    FROM   nexa.contract_versions
    WHERE  contract_id = NEW.contract_id;

    NEW.version_number  := v_next;
    NEW.content_hash    := nexa.fn_contract_content_hash(NEW.content);
    RETURN NEW;
END;
$$;


ALTER FUNCTION nexa.fn_set_contract_version() OWNER TO postgres;

--
-- TOC entry 413 (class 1255 OID 17703)
-- Name: fn_set_sla_deadline(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_set_sla_deadline() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.sla_deadline := NEW.created_at + INTERVAL '3 days';
    RETURN NEW;
END;
$$;


ALTER FUNCTION nexa.fn_set_sla_deadline() OWNER TO postgres;

--
-- TOC entry 365 (class 1255 OID 18093)
-- Name: fn_set_updated_at(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION nexa.fn_set_updated_at() OWNER TO postgres;

--
-- TOC entry 420 (class 1255 OID 17912)
-- Name: fn_validate_professor_comment(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_validate_professor_comment() RETURNS trigger
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


ALTER FUNCTION nexa.fn_validate_professor_comment() OWNER TO postgres;

--
-- TOC entry 289 (class 1255 OID 17518)
-- Name: fn_validate_project_client(); Type: FUNCTION; Schema: nexa; Owner: postgres
--

CREATE FUNCTION nexa.fn_validate_project_client() RETURNS trigger
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


ALTER FUNCTION nexa.fn_validate_project_client() OWNER TO postgres;

SET default_tablespace = '';

--
-- TOC entry 246 (class 1259 OID 17977)
-- Name: audit_logs; Type: TABLE; Schema: audit; Owner: postgres
--

CREATE TABLE audit.audit_logs (
    id bigint NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id uuid,
    user_email character varying(255),
    user_role text,
    ip_address inet,
    user_agent text,
    action audit.audit_action NOT NULL,
    schema_name character varying(100),
    table_name character varying(100),
    record_id text,
    old_values jsonb,
    new_values jsonb,
    context jsonb,
    success boolean DEFAULT true NOT NULL,
    error_message text
)
PARTITION BY RANGE (occurred_at);

ALTER TABLE ONLY audit.audit_logs FORCE ROW LEVEL SECURITY;


ALTER TABLE audit.audit_logs OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 17976)
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: audit; Owner: postgres
--

CREATE SEQUENCE audit.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE audit.audit_logs_id_seq OWNER TO postgres;

--
-- TOC entry 5877 (class 0 OID 0)
-- Dependencies: 245
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: audit; Owner: postgres
--

ALTER SEQUENCE audit.audit_logs_id_seq OWNED BY audit.audit_logs.id;


SET default_table_access_method = heap;

--
-- TOC entry 247 (class 1259 OID 17991)
-- Name: audit_logs_default; Type: TABLE; Schema: audit; Owner: postgres
--

CREATE TABLE audit.audit_logs_default (
    id bigint DEFAULT nextval('audit.audit_logs_id_seq'::regclass) CONSTRAINT audit_logs_id_not_null NOT NULL,
    occurred_at timestamp with time zone DEFAULT now() CONSTRAINT audit_logs_occurred_at_not_null NOT NULL,
    user_id uuid,
    user_email character varying(255),
    user_role text,
    ip_address inet,
    user_agent text,
    action audit.audit_action CONSTRAINT audit_logs_action_not_null NOT NULL,
    schema_name character varying(100),
    table_name character varying(100),
    record_id text,
    old_values jsonb,
    new_values jsonb,
    context jsonb,
    success boolean DEFAULT true CONSTRAINT audit_logs_success_not_null NOT NULL,
    error_message text
);


ALTER TABLE audit.audit_logs_default OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 18145)
-- Name: backup_log; Type: TABLE; Schema: monitoring; Owner: postgres
--

CREATE TABLE monitoring.backup_log (
    id bigint NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    backup_type text NOT NULL,
    destination text NOT NULL,
    size_bytes bigint,
    success boolean DEFAULT false NOT NULL,
    error_message text,
    duration_secs numeric GENERATED ALWAYS AS (EXTRACT(epoch FROM (completed_at - started_at))) STORED
);


ALTER TABLE monitoring.backup_log OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 18144)
-- Name: backup_log_id_seq; Type: SEQUENCE; Schema: monitoring; Owner: postgres
--

CREATE SEQUENCE monitoring.backup_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE monitoring.backup_log_id_seq OWNER TO postgres;

--
-- TOC entry 5880 (class 0 OID 0)
-- Dependencies: 256
-- Name: backup_log_id_seq; Type: SEQUENCE OWNED BY; Schema: monitoring; Owner: postgres
--

ALTER SEQUENCE monitoring.backup_log_id_seq OWNED BY monitoring.backup_log.id;


--
-- TOC entry 251 (class 1259 OID 18020)
-- Name: sla_alerts; Type: TABLE; Schema: monitoring; Owner: postgres
--

CREATE TABLE monitoring.sla_alerts (
    id bigint NOT NULL,
    ticket_id uuid NOT NULL,
    alert_type text NOT NULL,
    triggered_at timestamp with time zone DEFAULT now() NOT NULL,
    notified boolean DEFAULT false NOT NULL,
    CONSTRAINT sla_alerts_alert_type_check CHECK ((alert_type = ANY (ARRAY['SLA_WARNING'::text, 'SLA_BREACH'::text])))
);


ALTER TABLE monitoring.sla_alerts OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 18019)
-- Name: sla_alerts_id_seq; Type: SEQUENCE; Schema: monitoring; Owner: postgres
--

CREATE SEQUENCE monitoring.sla_alerts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE monitoring.sla_alerts_id_seq OWNER TO postgres;

--
-- TOC entry 5882 (class 0 OID 0)
-- Dependencies: 250
-- Name: sla_alerts_id_seq; Type: SEQUENCE OWNED BY; Schema: monitoring; Owner: postgres
--

ALTER SEQUENCE monitoring.sla_alerts_id_seq OWNED BY monitoring.sla_alerts.id;


--
-- TOC entry 249 (class 1259 OID 18006)
-- Name: slow_query_log; Type: TABLE; Schema: monitoring; Owner: postgres
--

CREATE TABLE monitoring.slow_query_log (
    id bigint NOT NULL,
    logged_at timestamp with time zone DEFAULT now() NOT NULL,
    query_text text NOT NULL,
    duration_ms numeric NOT NULL,
    user_name text,
    database_name text,
    rows_examined bigint
);


ALTER TABLE monitoring.slow_query_log OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 18005)
-- Name: slow_query_log_id_seq; Type: SEQUENCE; Schema: monitoring; Owner: postgres
--

CREATE SEQUENCE monitoring.slow_query_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE monitoring.slow_query_log_id_seq OWNER TO postgres;

--
-- TOC entry 5884 (class 0 OID 0)
-- Dependencies: 248
-- Name: slow_query_log_id_seq; Type: SEQUENCE OWNED BY; Schema: monitoring; Owner: postgres
--

ALTER SEQUENCE monitoring.slow_query_log_id_seq OWNED BY monitoring.slow_query_log.id;


--
-- TOC entry 236 (class 1259 OID 17641)
-- Name: contract_signatures; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.contract_signatures (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    contract_id uuid NOT NULL,
    user_id uuid NOT NULL,
    signature_image text,
    ip_address inet NOT NULL,
    content_hash_at_sign character varying(64) NOT NULL,
    signed_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contract_signatures_hash_length CHECK ((length((content_hash_at_sign)::text) = 64))
);

ALTER TABLE ONLY nexa.contract_signatures FORCE ROW LEVEL SECURITY;


ALTER TABLE nexa.contract_signatures OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 17880)
-- Name: contract_versions; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.contract_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    contract_id uuid NOT NULL,
    version_number smallint NOT NULL,
    content text NOT NULL,
    content_hash character varying(64) NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contract_versions_hash_len CHECK ((length((content_hash)::text) = 64))
);


ALTER TABLE nexa.contract_versions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17610)
-- Name: contracts; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.contracts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    content_hash character varying(64) NOT NULL,
    status nexa.contract_status DEFAULT 'PENDING'::nexa.contract_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT contracts_hash_length CHECK ((length((content_hash)::text) = 64))
);


ALTER TABLE nexa.contracts OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 17848)
-- Name: demand_assignees; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.demand_assignees (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    demand_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_by uuid NOT NULL
);


ALTER TABLE nexa.demand_assignees OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17578)
-- Name: demand_files; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.demand_files (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    demand_id uuid NOT NULL,
    subfolder nexa.demand_subfolder NOT NULL,
    file_name character varying(500) NOT NULL,
    file_key text NOT NULL,
    file_size_bytes bigint NOT NULL,
    mime_type character varying(255) NOT NULL,
    uploaded_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT demand_files_size_positive CHECK ((file_size_bytes > 0)),
    CONSTRAINT demand_files_zip_only CHECK (((subfolder <> 'zip'::nexa.demand_subfolder) OR ((mime_type)::text = 'application/zip'::text)))
);


ALTER TABLE nexa.demand_files OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17549)
-- Name: demands; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.demands (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    deadline timestamp with time zone NOT NULL,
    status nexa.demand_status DEFAULT 'PENDING'::nexa.demand_status NOT NULL,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE nexa.demands OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 17729)
-- Name: financial_entries; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.financial_entries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    type nexa.financial_type NOT NULL,
    description character varying(500) NOT NULL,
    amount_cents bigint NOT NULL,
    due_date date NOT NULL,
    status nexa.financial_status DEFAULT 'PENDING'::nexa.financial_status NOT NULL,
    category character varying(100),
    project_id uuid,
    created_by uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    paid_at timestamp with time zone,
    paid_by uuid,
    CONSTRAINT financial_entries_amount_positive CHECK ((amount_cents > 0)),
    CONSTRAINT financial_paid_at_consistency CHECK ((((status = 'PAID'::nexa.financial_status) AND (paid_at IS NOT NULL)) OR ((status <> 'PAID'::nexa.financial_status) AND (paid_at IS NULL))))
);

ALTER TABLE ONLY nexa.financial_entries FORCE ROW LEVEL SECURITY;


ALTER TABLE nexa.financial_entries OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 17939)
-- Name: notifications; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    type nexa.notification_type NOT NULL,
    title character varying(255) NOT NULL,
    body text,
    related_table character varying(100),
    related_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE nexa.notifications OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 17760)
-- Name: professor_comments; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.professor_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    target_id uuid NOT NULL,
    author_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT professor_comments_no_self CHECK ((target_id <> author_id))
);


ALTER TABLE nexa.professor_comments OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 17787)
-- Name: profitability_goals; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.profitability_goals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    month character(7) NOT NULL,
    target_cents bigint NOT NULL,
    actual_cents bigint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profitability_goals_actual_positive CHECK ((actual_cents >= 0)),
    CONSTRAINT profitability_goals_month_format CHECK ((month ~ '^\d{4}-\d{2}$'::text)),
    CONSTRAINT profitability_goals_target_positive CHECK ((target_cents > 0))
);


ALTER TABLE nexa.profitability_goals OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17520)
-- Name: project_members; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.project_members (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid NOT NULL,
    user_id uuid NOT NULL,
    assigned_at timestamp with time zone DEFAULT now() NOT NULL,
    productivity numeric(5,2) DEFAULT 0.00 NOT NULL,
    progress numeric(5,2) DEFAULT 0.00 NOT NULL,
    CONSTRAINT project_members_productivity_range CHECK (((productivity >= (0)::numeric) AND (productivity <= (100)::numeric))),
    CONSTRAINT project_members_progress_range CHECK (((progress >= (0)::numeric) AND (progress <= (100)::numeric)))
);


ALTER TABLE nexa.project_members OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17489)
-- Name: projects; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    deadline timestamp with time zone NOT NULL,
    status nexa.project_status DEFAULT 'ACTIVE'::nexa.project_status NOT NULL,
    owner_id uuid NOT NULL,
    client_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT projects_deadline_future CHECK ((deadline > now()))
);


ALTER TABLE nexa.projects OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17705)
-- Name: ticket_responses; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.ticket_responses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    ticket_id uuid NOT NULL,
    author_id uuid NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE nexa.ticket_responses OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17674)
-- Name: tickets; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    project_id uuid,
    creator_id uuid NOT NULL,
    subject character varying(500) NOT NULL,
    description text NOT NULL,
    status nexa.ticket_status DEFAULT 'OPEN'::nexa.ticket_status NOT NULL,
    sla_deadline timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE nexa.tickets OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17422)
-- Name: user_sessions; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash character varying(64) NOT NULL,
    ip_address inet NOT NULL,
    user_agent text,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE nexa.user_sessions OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17395)
-- Name: users; Type: TABLE; Schema: nexa; Owner: postgres
--

CREATE TABLE nexa.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    name character varying(255) NOT NULL,
    role nexa.user_role NOT NULL,
    avatar_url text,
    cpf_cnpj_encrypted bytea,
    cpf_cnpj_hash character varying(64),
    is_active boolean DEFAULT true NOT NULL,
    last_login_at timestamp with time zone,
    failed_login_count smallint DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    reset_token_hash character varying(64),
    reset_token_expires timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT users_email_format CHECK (((email)::text ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'::text)),
    CONSTRAINT users_failed_logins_positive CHECK ((failed_login_count >= 0))
);

ALTER TABLE ONLY nexa.users FORCE ROW LEVEL SECURITY;


ALTER TABLE nexa.users OWNER TO postgres;

--
-- TOC entry 253 (class 1259 OID 18125)
-- Name: vw_financial_summary; Type: VIEW; Schema: nexa; Owner: postgres
--

CREATE VIEW nexa.vw_financial_summary WITH (security_barrier='true') AS
 SELECT date_trunc('month'::text, (due_date)::timestamp with time zone) AS month,
    type,
    status,
    (sum(amount_cents) / 100.0) AS total_amount,
    count(*) AS entry_count
   FROM nexa.financial_entries
  GROUP BY (date_trunc('month'::text, (due_date)::timestamp with time zone)), type, status;


ALTER VIEW nexa.vw_financial_summary OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 18129)
-- Name: vw_team_productivity; Type: VIEW; Schema: nexa; Owner: postgres
--

CREATE VIEW nexa.vw_team_productivity AS
 SELECT u.id AS user_id,
    u.name,
    u.role,
    p.id AS project_id,
    p.name AS project_name,
    pm.productivity,
    pm.progress,
    pm.assigned_at
   FROM ((nexa.project_members pm
     JOIN nexa.users u ON ((u.id = pm.user_id)))
     JOIN nexa.projects p ON ((p.id = pm.project_id)));


ALTER VIEW nexa.vw_team_productivity OWNER TO postgres;

--
-- TOC entry 255 (class 1259 OID 18134)
-- Name: vw_tickets_sla; Type: VIEW; Schema: nexa; Owner: postgres
--

CREATE VIEW nexa.vw_tickets_sla AS
 SELECT t.id,
    t.project_id,
    t.creator_id,
    t.subject,
    t.description,
    t.status,
    t.sla_deadline,
    t.created_at,
    t.updated_at,
        CASE
            WHEN ((t.sla_deadline < now()) AND (t.status = ANY (ARRAY['OPEN'::nexa.ticket_status, 'IN_PROGRESS'::nexa.ticket_status]))) THEN 'BREACHED'::text
            WHEN ((t.sla_deadline < (now() + '06:00:00'::interval)) AND (t.status = ANY (ARRAY['OPEN'::nexa.ticket_status, 'IN_PROGRESS'::nexa.ticket_status]))) THEN 'WARNING'::text
            ELSE 'OK'::text
        END AS sla_status,
    u.name AS creator_name
   FROM (nexa.tickets t
     JOIN nexa.users u ON ((u.id = t.creator_id)));


ALTER VIEW nexa.vw_tickets_sla OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 18121)
-- Name: vw_users_public; Type: VIEW; Schema: nexa; Owner: postgres
--

CREATE VIEW nexa.vw_users_public AS
 SELECT id,
    name,
    email,
    role,
    avatar_url,
    is_active,
    last_login_at,
    created_at
   FROM nexa.users;


ALTER VIEW nexa.vw_users_public OWNER TO postgres;

--
-- TOC entry 5397 (class 0 OID 0)
-- Name: audit_logs_default; Type: TABLE ATTACH; Schema: audit; Owner: postgres
--

ALTER TABLE ONLY audit.audit_logs ATTACH PARTITION audit.audit_logs_default DEFAULT;


--
-- TOC entry 5450 (class 2604 OID 17980)
-- Name: audit_logs id; Type: DEFAULT; Schema: audit; Owner: postgres
--

ALTER TABLE ONLY audit.audit_logs ALTER COLUMN id SET DEFAULT nextval('audit.audit_logs_id_seq'::regclass);


--
-- TOC entry 5461 (class 2604 OID 18148)
-- Name: backup_log id; Type: DEFAULT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.backup_log ALTER COLUMN id SET DEFAULT nextval('monitoring.backup_log_id_seq'::regclass);


--
-- TOC entry 5458 (class 2604 OID 18023)
-- Name: sla_alerts id; Type: DEFAULT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.sla_alerts ALTER COLUMN id SET DEFAULT nextval('monitoring.sla_alerts_id_seq'::regclass);


--
-- TOC entry 5456 (class 2604 OID 18009)
-- Name: slow_query_log id; Type: DEFAULT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.slow_query_log ALTER COLUMN id SET DEFAULT nextval('monitoring.slow_query_log_id_seq'::regclass);


--
-- TOC entry 5854 (class 0 OID 17991)
-- Dependencies: 247
-- Data for Name: audit_logs_default; Type: TABLE DATA; Schema: audit; Owner: postgres
--

COPY audit.audit_logs_default (id, occurred_at, user_id, user_email, user_role, ip_address, user_agent, action, schema_name, table_name, record_id, old_values, new_values, context, success, error_message) FROM stdin;
\.


--
-- TOC entry 5860 (class 0 OID 18145)
-- Dependencies: 257
-- Data for Name: backup_log; Type: TABLE DATA; Schema: monitoring; Owner: postgres
--

COPY monitoring.backup_log (id, started_at, completed_at, backup_type, destination, size_bytes, success, error_message) FROM stdin;
\.


--
-- TOC entry 5858 (class 0 OID 18020)
-- Dependencies: 251
-- Data for Name: sla_alerts; Type: TABLE DATA; Schema: monitoring; Owner: postgres
--

COPY monitoring.sla_alerts (id, ticket_id, alert_type, triggered_at, notified) FROM stdin;
\.


--
-- TOC entry 5856 (class 0 OID 18006)
-- Dependencies: 249
-- Data for Name: slow_query_log; Type: TABLE DATA; Schema: monitoring; Owner: postgres
--

COPY monitoring.slow_query_log (id, logged_at, query_text, duration_ms, user_name, database_name, rows_examined) FROM stdin;
\.


--
-- TOC entry 5844 (class 0 OID 17641)
-- Dependencies: 236
-- Data for Name: contract_signatures; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.contract_signatures (id, contract_id, user_id, signature_image, ip_address, content_hash_at_sign, signed_at) FROM stdin;
\.


--
-- TOC entry 5851 (class 0 OID 17880)
-- Dependencies: 243
-- Data for Name: contract_versions; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.contract_versions (id, contract_id, version_number, content, content_hash, created_by, created_at) FROM stdin;
\.


--
-- TOC entry 5843 (class 0 OID 17610)
-- Dependencies: 235
-- Data for Name: contracts; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.contracts (id, project_id, title, content, content_hash, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5850 (class 0 OID 17848)
-- Dependencies: 242
-- Data for Name: demand_assignees; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.demand_assignees (id, demand_id, user_id, assigned_at, assigned_by) FROM stdin;
\.


--
-- TOC entry 5842 (class 0 OID 17578)
-- Dependencies: 234
-- Data for Name: demand_files; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.demand_files (id, demand_id, subfolder, file_name, file_key, file_size_bytes, mime_type, uploaded_by, created_at) FROM stdin;
\.


--
-- TOC entry 5841 (class 0 OID 17549)
-- Dependencies: 233
-- Data for Name: demands; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.demands (id, project_id, title, description, deadline, status, created_by, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5847 (class 0 OID 17729)
-- Dependencies: 239
-- Data for Name: financial_entries; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.financial_entries (id, type, description, amount_cents, due_date, status, category, project_id, created_by, created_at, updated_at, paid_at, paid_by) FROM stdin;
\.


--
-- TOC entry 5852 (class 0 OID 17939)
-- Dependencies: 244
-- Data for Name: notifications; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.notifications (id, user_id, type, title, body, related_table, related_id, is_read, read_at, created_at) FROM stdin;
\.


--
-- TOC entry 5848 (class 0 OID 17760)
-- Dependencies: 240
-- Data for Name: professor_comments; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.professor_comments (id, target_id, author_id, comment, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5849 (class 0 OID 17787)
-- Dependencies: 241
-- Data for Name: profitability_goals; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.profitability_goals (id, user_id, month, target_cents, actual_cents, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5840 (class 0 OID 17520)
-- Dependencies: 232
-- Data for Name: project_members; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.project_members (id, project_id, user_id, assigned_at, productivity, progress) FROM stdin;
\.


--
-- TOC entry 5839 (class 0 OID 17489)
-- Dependencies: 231
-- Data for Name: projects; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.projects (id, name, description, deadline, status, owner_id, client_id, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5846 (class 0 OID 17705)
-- Dependencies: 238
-- Data for Name: ticket_responses; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.ticket_responses (id, ticket_id, author_id, message, created_at) FROM stdin;
\.


--
-- TOC entry 5845 (class 0 OID 17674)
-- Dependencies: 237
-- Data for Name: tickets; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.tickets (id, project_id, creator_id, subject, description, status, sla_deadline, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5838 (class 0 OID 17422)
-- Dependencies: 230
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.user_sessions (id, user_id, refresh_token_hash, ip_address, user_agent, expires_at, is_revoked, created_at) FROM stdin;
\.


--
-- TOC entry 5837 (class 0 OID 17395)
-- Dependencies: 229
-- Data for Name: users; Type: TABLE DATA; Schema: nexa; Owner: postgres
--

COPY nexa.users (id, email, password_hash, name, role, avatar_url, cpf_cnpj_encrypted, cpf_cnpj_hash, is_active, last_login_at, failed_login_count, locked_until, reset_token_hash, reset_token_expires, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5905 (class 0 OID 0)
-- Dependencies: 245
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: audit; Owner: postgres
--

SELECT pg_catalog.setval('audit.audit_logs_id_seq', 1, false);


--
-- TOC entry 5906 (class 0 OID 0)
-- Dependencies: 256
-- Name: backup_log_id_seq; Type: SEQUENCE SET; Schema: monitoring; Owner: postgres
--

SELECT pg_catalog.setval('monitoring.backup_log_id_seq', 1, false);


--
-- TOC entry 5907 (class 0 OID 0)
-- Dependencies: 250
-- Name: sla_alerts_id_seq; Type: SEQUENCE SET; Schema: monitoring; Owner: postgres
--

SELECT pg_catalog.setval('monitoring.sla_alerts_id_seq', 1, false);


--
-- TOC entry 5908 (class 0 OID 0)
-- Dependencies: 248
-- Name: slow_query_log_id_seq; Type: SEQUENCE SET; Schema: monitoring; Owner: postgres
--

SELECT pg_catalog.setval('monitoring.slow_query_log_id_seq', 1, false);


--
-- TOC entry 5566 (class 2606 OID 17988)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: audit; Owner: postgres
--

ALTER TABLE ONLY audit.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id, occurred_at);


--
-- TOC entry 5576 (class 2606 OID 17998)
-- Name: audit_logs_default audit_logs_default_pkey; Type: CONSTRAINT; Schema: audit; Owner: postgres
--

ALTER TABLE ONLY audit.audit_logs_default
    ADD CONSTRAINT audit_logs_default_pkey PRIMARY KEY (id, occurred_at);


--
-- TOC entry 5588 (class 2606 OID 18159)
-- Name: backup_log backup_log_pkey; Type: CONSTRAINT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.backup_log
    ADD CONSTRAINT backup_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5584 (class 2606 OID 18035)
-- Name: sla_alerts sla_alerts_pkey; Type: CONSTRAINT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.sla_alerts
    ADD CONSTRAINT sla_alerts_pkey PRIMARY KEY (id);


--
-- TOC entry 5586 (class 2606 OID 18037)
-- Name: sla_alerts sla_alerts_unique; Type: CONSTRAINT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.sla_alerts
    ADD CONSTRAINT sla_alerts_unique UNIQUE (ticket_id, alert_type);


--
-- TOC entry 5582 (class 2606 OID 18018)
-- Name: slow_query_log slow_query_log_pkey; Type: CONSTRAINT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.slow_query_log
    ADD CONSTRAINT slow_query_log_pkey PRIMARY KEY (id);


--
-- TOC entry 5527 (class 2606 OID 17656)
-- Name: contract_signatures contract_signatures_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_signatures
    ADD CONSTRAINT contract_signatures_pkey PRIMARY KEY (id);


--
-- TOC entry 5529 (class 2606 OID 17658)
-- Name: contract_signatures contract_signatures_unique; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_signatures
    ADD CONSTRAINT contract_signatures_unique UNIQUE (contract_id, user_id);


--
-- TOC entry 5557 (class 2606 OID 17896)
-- Name: contract_versions contract_versions_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_versions
    ADD CONSTRAINT contract_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 5559 (class 2606 OID 17898)
-- Name: contract_versions contract_versions_unique; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_versions
    ADD CONSTRAINT contract_versions_unique UNIQUE (contract_id, version_number);


--
-- TOC entry 5523 (class 2606 OID 17630)
-- Name: contracts contracts_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contracts
    ADD CONSTRAINT contracts_pkey PRIMARY KEY (id);


--
-- TOC entry 5551 (class 2606 OID 17859)
-- Name: demand_assignees demand_assignees_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_assignees
    ADD CONSTRAINT demand_assignees_pkey PRIMARY KEY (id);


--
-- TOC entry 5553 (class 2606 OID 17861)
-- Name: demand_assignees demand_assignees_unique; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_assignees
    ADD CONSTRAINT demand_assignees_unique UNIQUE (demand_id, user_id);


--
-- TOC entry 5517 (class 2606 OID 17599)
-- Name: demand_files demand_files_file_key_key; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_files
    ADD CONSTRAINT demand_files_file_key_key UNIQUE (file_key);


--
-- TOC entry 5519 (class 2606 OID 17597)
-- Name: demand_files demand_files_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_files
    ADD CONSTRAINT demand_files_pkey PRIMARY KEY (id);


--
-- TOC entry 5510 (class 2606 OID 17567)
-- Name: demands demands_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demands
    ADD CONSTRAINT demands_pkey PRIMARY KEY (id);


--
-- TOC entry 5539 (class 2606 OID 17749)
-- Name: financial_entries financial_entries_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.financial_entries
    ADD CONSTRAINT financial_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 5564 (class 2606 OID 17954)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 5545 (class 2606 OID 17776)
-- Name: professor_comments professor_comments_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.professor_comments
    ADD CONSTRAINT professor_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 5547 (class 2606 OID 17805)
-- Name: profitability_goals profitability_goals_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.profitability_goals
    ADD CONSTRAINT profitability_goals_pkey PRIMARY KEY (id);


--
-- TOC entry 5549 (class 2606 OID 17807)
-- Name: profitability_goals profitability_goals_unique_month; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.profitability_goals
    ADD CONSTRAINT profitability_goals_unique_month UNIQUE (user_id, month);


--
-- TOC entry 5506 (class 2606 OID 17536)
-- Name: project_members project_members_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.project_members
    ADD CONSTRAINT project_members_pkey PRIMARY KEY (id);


--
-- TOC entry 5508 (class 2606 OID 17538)
-- Name: project_members project_members_unique; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.project_members
    ADD CONSTRAINT project_members_unique UNIQUE (project_id, user_id);


--
-- TOC entry 5502 (class 2606 OID 17507)
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- TOC entry 5537 (class 2606 OID 17718)
-- Name: ticket_responses ticket_responses_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.ticket_responses
    ADD CONSTRAINT ticket_responses_pkey PRIMARY KEY (id);


--
-- TOC entry 5535 (class 2606 OID 17692)
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- TOC entry 5494 (class 2606 OID 17438)
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 5496 (class 2606 OID 17440)
-- Name: user_sessions user_sessions_refresh_token_hash_key; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_hash_key UNIQUE (refresh_token_hash);


--
-- TOC entry 5485 (class 2606 OID 17419)
-- Name: users users_cpf_cnpj_hash_key; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.users
    ADD CONSTRAINT users_cpf_cnpj_hash_key UNIQUE (cpf_cnpj_hash);


--
-- TOC entry 5487 (class 2606 OID 17421)
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- TOC entry 5489 (class 2606 OID 17417)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 5567 (class 1259 OID 18082)
-- Name: idx_audit_action; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX idx_audit_action ON ONLY audit.audit_logs USING btree (action);


--
-- TOC entry 5573 (class 1259 OID 18083)
-- Name: audit_logs_default_action_idx; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX audit_logs_default_action_idx ON audit.audit_logs_default USING btree (action);


--
-- TOC entry 5568 (class 1259 OID 18072)
-- Name: idx_audit_occurred_at; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX idx_audit_occurred_at ON ONLY audit.audit_logs USING btree (occurred_at DESC);


--
-- TOC entry 5574 (class 1259 OID 18073)
-- Name: audit_logs_default_occurred_at_idx; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX audit_logs_default_occurred_at_idx ON audit.audit_logs_default USING btree (occurred_at DESC);


--
-- TOC entry 5570 (class 1259 OID 18078)
-- Name: idx_audit_table_action; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX idx_audit_table_action ON ONLY audit.audit_logs USING btree (table_name, action, occurred_at DESC);


--
-- TOC entry 5577 (class 1259 OID 18079)
-- Name: audit_logs_default_table_name_action_occurred_at_idx; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX audit_logs_default_table_name_action_occurred_at_idx ON audit.audit_logs_default USING btree (table_name, action, occurred_at DESC);


--
-- TOC entry 5569 (class 1259 OID 18080)
-- Name: idx_audit_table; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX idx_audit_table ON ONLY audit.audit_logs USING btree (table_name, schema_name);


--
-- TOC entry 5578 (class 1259 OID 18081)
-- Name: audit_logs_default_table_name_schema_name_idx; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX audit_logs_default_table_name_schema_name_idx ON audit.audit_logs_default USING btree (table_name, schema_name);


--
-- TOC entry 5572 (class 1259 OID 18074)
-- Name: idx_audit_user_id; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX idx_audit_user_id ON ONLY audit.audit_logs USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- TOC entry 5579 (class 1259 OID 18075)
-- Name: audit_logs_default_user_id_idx; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX audit_logs_default_user_id_idx ON audit.audit_logs_default USING btree (user_id) WHERE (user_id IS NOT NULL);


--
-- TOC entry 5571 (class 1259 OID 18076)
-- Name: idx_audit_user_date; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX idx_audit_user_date ON ONLY audit.audit_logs USING btree (user_id, occurred_at DESC) WHERE (user_id IS NOT NULL);


--
-- TOC entry 5580 (class 1259 OID 18077)
-- Name: audit_logs_default_user_id_occurred_at_idx; Type: INDEX; Schema: audit; Owner: postgres
--

CREATE INDEX audit_logs_default_user_id_occurred_at_idx ON audit.audit_logs_default USING btree (user_id, occurred_at DESC) WHERE (user_id IS NOT NULL);


--
-- TOC entry 5560 (class 1259 OID 17909)
-- Name: idx_contract_versions_contract; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_contract_versions_contract ON nexa.contract_versions USING btree (contract_id);


--
-- TOC entry 5524 (class 1259 OID 18062)
-- Name: idx_contracts_project; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_contracts_project ON nexa.contracts USING btree (project_id);


--
-- TOC entry 5525 (class 1259 OID 18063)
-- Name: idx_contracts_status; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_contracts_status ON nexa.contracts USING btree (status);


--
-- TOC entry 5554 (class 1259 OID 17877)
-- Name: idx_demand_assignees_demand; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demand_assignees_demand ON nexa.demand_assignees USING btree (demand_id);


--
-- TOC entry 5555 (class 1259 OID 17878)
-- Name: idx_demand_assignees_user; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demand_assignees_user ON nexa.demand_assignees USING btree (user_id);


--
-- TOC entry 5520 (class 1259 OID 18060)
-- Name: idx_demand_files_demand; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demand_files_demand ON nexa.demand_files USING btree (demand_id);


--
-- TOC entry 5521 (class 1259 OID 18061)
-- Name: idx_demand_files_subfolder; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demand_files_subfolder ON nexa.demand_files USING btree (subfolder);


--
-- TOC entry 5511 (class 1259 OID 18057)
-- Name: idx_demands_deadline; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demands_deadline ON nexa.demands USING btree (deadline);


--
-- TOC entry 5512 (class 1259 OID 18059)
-- Name: idx_demands_desc_trgm; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demands_desc_trgm ON nexa.demands USING gin (description public.gin_trgm_ops);


--
-- TOC entry 5513 (class 1259 OID 18055)
-- Name: idx_demands_project; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demands_project ON nexa.demands USING btree (project_id);


--
-- TOC entry 5514 (class 1259 OID 18056)
-- Name: idx_demands_status; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demands_status ON nexa.demands USING btree (status);


--
-- TOC entry 5515 (class 1259 OID 18058)
-- Name: idx_demands_title_trgm; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_demands_title_trgm ON nexa.demands USING gin (title public.gin_trgm_ops);


--
-- TOC entry 5540 (class 1259 OID 18070)
-- Name: idx_financial_due_date; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_financial_due_date ON nexa.financial_entries USING btree (due_date);


--
-- TOC entry 5541 (class 1259 OID 18071)
-- Name: idx_financial_project; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_financial_project ON nexa.financial_entries USING btree (project_id) WHERE (project_id IS NOT NULL);


--
-- TOC entry 5542 (class 1259 OID 18069)
-- Name: idx_financial_status; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_financial_status ON nexa.financial_entries USING btree (status);


--
-- TOC entry 5543 (class 1259 OID 18068)
-- Name: idx_financial_type; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_financial_type ON nexa.financial_entries USING btree (type);


--
-- TOC entry 5561 (class 1259 OID 17961)
-- Name: idx_notifications_unread; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_notifications_unread ON nexa.notifications USING btree (user_id) WHERE (is_read = false);


--
-- TOC entry 5562 (class 1259 OID 17960)
-- Name: idx_notifications_user; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_notifications_user ON nexa.notifications USING btree (user_id, is_read, created_at DESC);


--
-- TOC entry 5503 (class 1259 OID 18053)
-- Name: idx_project_members_project; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_project_members_project ON nexa.project_members USING btree (project_id);


--
-- TOC entry 5504 (class 1259 OID 18054)
-- Name: idx_project_members_user; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_project_members_user ON nexa.project_members USING btree (user_id);


--
-- TOC entry 5497 (class 1259 OID 18050)
-- Name: idx_projects_client; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_projects_client ON nexa.projects USING btree (client_id) WHERE (client_id IS NOT NULL);


--
-- TOC entry 5498 (class 1259 OID 18052)
-- Name: idx_projects_deadline; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_projects_deadline ON nexa.projects USING btree (deadline);


--
-- TOC entry 5499 (class 1259 OID 18049)
-- Name: idx_projects_owner; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_projects_owner ON nexa.projects USING btree (owner_id);


--
-- TOC entry 5500 (class 1259 OID 18051)
-- Name: idx_projects_status; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_projects_status ON nexa.projects USING btree (status);


--
-- TOC entry 5490 (class 1259 OID 18047)
-- Name: idx_sessions_expires; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_sessions_expires ON nexa.user_sessions USING btree (expires_at) WHERE (is_revoked = false);


--
-- TOC entry 5491 (class 1259 OID 18048)
-- Name: idx_sessions_user_active; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_sessions_user_active ON nexa.user_sessions USING btree (user_id, is_revoked, expires_at) WHERE (is_revoked = false);


--
-- TOC entry 5492 (class 1259 OID 18046)
-- Name: idx_sessions_user_id; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON nexa.user_sessions USING btree (user_id);


--
-- TOC entry 5530 (class 1259 OID 18064)
-- Name: idx_tickets_creator; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_tickets_creator ON nexa.tickets USING btree (creator_id);


--
-- TOC entry 5531 (class 1259 OID 18065)
-- Name: idx_tickets_project; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_tickets_project ON nexa.tickets USING btree (project_id) WHERE (project_id IS NOT NULL);


--
-- TOC entry 5532 (class 1259 OID 18067)
-- Name: idx_tickets_sla; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_tickets_sla ON nexa.tickets USING btree (sla_deadline) WHERE (status = ANY (ARRAY['OPEN'::nexa.ticket_status, 'IN_PROGRESS'::nexa.ticket_status]));


--
-- TOC entry 5533 (class 1259 OID 18066)
-- Name: idx_tickets_status; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_tickets_status ON nexa.tickets USING btree (status);


--
-- TOC entry 5481 (class 1259 OID 18045)
-- Name: idx_users_active; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_users_active ON nexa.users USING btree (is_active) WHERE (is_active = true);


--
-- TOC entry 5482 (class 1259 OID 18044)
-- Name: idx_users_cpf_cnpj_hash; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_users_cpf_cnpj_hash ON nexa.users USING btree (cpf_cnpj_hash) WHERE (cpf_cnpj_hash IS NOT NULL);


--
-- TOC entry 5483 (class 1259 OID 18043)
-- Name: idx_users_role; Type: INDEX; Schema: nexa; Owner: postgres
--

CREATE INDEX idx_users_role ON nexa.users USING btree (role);


--
-- TOC entry 5589 (class 0 OID 0)
-- Name: audit_logs_default_action_idx; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.idx_audit_action ATTACH PARTITION audit.audit_logs_default_action_idx;


--
-- TOC entry 5590 (class 0 OID 0)
-- Name: audit_logs_default_occurred_at_idx; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.idx_audit_occurred_at ATTACH PARTITION audit.audit_logs_default_occurred_at_idx;


--
-- TOC entry 5591 (class 0 OID 0)
-- Name: audit_logs_default_pkey; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.audit_logs_pkey ATTACH PARTITION audit.audit_logs_default_pkey;


--
-- TOC entry 5592 (class 0 OID 0)
-- Name: audit_logs_default_table_name_action_occurred_at_idx; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.idx_audit_table_action ATTACH PARTITION audit.audit_logs_default_table_name_action_occurred_at_idx;


--
-- TOC entry 5593 (class 0 OID 0)
-- Name: audit_logs_default_table_name_schema_name_idx; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.idx_audit_table ATTACH PARTITION audit.audit_logs_default_table_name_schema_name_idx;


--
-- TOC entry 5594 (class 0 OID 0)
-- Name: audit_logs_default_user_id_idx; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.idx_audit_user_id ATTACH PARTITION audit.audit_logs_default_user_id_idx;


--
-- TOC entry 5595 (class 0 OID 0)
-- Name: audit_logs_default_user_id_occurred_at_idx; Type: INDEX ATTACH; Schema: audit; Owner: postgres
--

ALTER INDEX audit.idx_audit_user_date ATTACH PARTITION audit.audit_logs_default_user_id_occurred_at_idx;


--
-- TOC entry 5636 (class 2620 OID 18089)
-- Name: contract_signatures trg_audit_contract_signatures; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_contract_signatures AFTER INSERT OR DELETE OR UPDATE ON nexa.contract_signatures FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5633 (class 2620 OID 18088)
-- Name: contracts trg_audit_contracts; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_contracts AFTER INSERT OR DELETE OR UPDATE ON nexa.contracts FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5642 (class 2620 OID 18090)
-- Name: financial_entries trg_audit_financial_entries; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_financial_entries AFTER INSERT OR DELETE OR UPDATE ON nexa.financial_entries FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5631 (class 2620 OID 18092)
-- Name: project_members trg_audit_project_members; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_project_members AFTER INSERT OR DELETE OR UPDATE ON nexa.project_members FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5628 (class 2620 OID 18087)
-- Name: projects trg_audit_projects; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_projects AFTER INSERT OR DELETE OR UPDATE ON nexa.projects FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5638 (class 2620 OID 18091)
-- Name: tickets trg_audit_tickets; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_tickets AFTER INSERT OR DELETE OR UPDATE ON nexa.tickets FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5626 (class 2620 OID 18086)
-- Name: users trg_audit_users; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_audit_users AFTER INSERT OR DELETE OR UPDATE ON nexa.users FOR EACH ROW EXECUTE FUNCTION audit.fn_audit_trigger();


--
-- TOC entry 5637 (class 2620 OID 17915)
-- Name: contract_signatures trg_block_signature_update; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_block_signature_update BEFORE DELETE OR UPDATE ON nexa.contract_signatures FOR EACH ROW EXECUTE FUNCTION nexa.fn_block_signature_update();


--
-- TOC entry 5647 (class 2620 OID 17920)
-- Name: contract_versions trg_block_version_update; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_block_version_update BEFORE DELETE OR UPDATE ON nexa.contract_versions FOR EACH ROW EXECUTE FUNCTION nexa.fn_block_signature_update();


--
-- TOC entry 5634 (class 2620 OID 18142)
-- Name: contracts trg_set_contract_hash; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_set_contract_hash BEFORE INSERT OR UPDATE OF content ON nexa.contracts FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_contract_hash();


--
-- TOC entry 5648 (class 2620 OID 17919)
-- Name: contract_versions trg_set_contract_version; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_set_contract_version BEFORE INSERT ON nexa.contract_versions FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_contract_version();


--
-- TOC entry 5639 (class 2620 OID 17704)
-- Name: tickets trg_set_sla_deadline; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_set_sla_deadline BEFORE INSERT ON nexa.tickets FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_sla_deadline();


--
-- TOC entry 5640 (class 2620 OID 17917)
-- Name: tickets trg_ticket_sla; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_ticket_sla AFTER INSERT OR UPDATE ON nexa.tickets FOR EACH ROW EXECUTE FUNCTION nexa.fn_check_ticket_sla();


--
-- TOC entry 5635 (class 2620 OID 18097)
-- Name: contracts trg_updated_at_contracts; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_contracts BEFORE UPDATE ON nexa.contracts FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5632 (class 2620 OID 18096)
-- Name: demands trg_updated_at_demands; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_demands BEFORE UPDATE ON nexa.demands FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5643 (class 2620 OID 18099)
-- Name: financial_entries trg_updated_at_financial_entries; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_financial_entries BEFORE UPDATE ON nexa.financial_entries FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5644 (class 2620 OID 18100)
-- Name: professor_comments trg_updated_at_professor_comments; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_professor_comments BEFORE UPDATE ON nexa.professor_comments FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5646 (class 2620 OID 18101)
-- Name: profitability_goals trg_updated_at_profitability_goals; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_profitability_goals BEFORE UPDATE ON nexa.profitability_goals FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5629 (class 2620 OID 18095)
-- Name: projects trg_updated_at_projects; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_projects BEFORE UPDATE ON nexa.projects FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5641 (class 2620 OID 18098)
-- Name: tickets trg_updated_at_tickets; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_tickets BEFORE UPDATE ON nexa.tickets FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5627 (class 2620 OID 18094)
-- Name: users trg_updated_at_users; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_updated_at_users BEFORE UPDATE ON nexa.users FOR EACH ROW EXECUTE FUNCTION nexa.fn_set_updated_at();


--
-- TOC entry 5645 (class 2620 OID 17913)
-- Name: professor_comments trg_validate_professor_comment; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_validate_professor_comment BEFORE INSERT OR UPDATE ON nexa.professor_comments FOR EACH ROW EXECUTE FUNCTION nexa.fn_validate_professor_comment();


--
-- TOC entry 5630 (class 2620 OID 18166)
-- Name: projects trg_validate_project_client; Type: TRIGGER; Schema: nexa; Owner: postgres
--

CREATE TRIGGER trg_validate_project_client BEFORE INSERT OR UPDATE ON nexa.projects FOR EACH ROW EXECUTE FUNCTION nexa.fn_validate_project_client();


--
-- TOC entry 5625 (class 2606 OID 18038)
-- Name: sla_alerts sla_alerts_ticket_id_fkey; Type: FK CONSTRAINT; Schema: monitoring; Owner: postgres
--

ALTER TABLE ONLY monitoring.sla_alerts
    ADD CONSTRAINT sla_alerts_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES nexa.tickets(id);


--
-- TOC entry 5607 (class 2606 OID 17659)
-- Name: contract_signatures contract_signatures_contract_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_signatures
    ADD CONSTRAINT contract_signatures_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES nexa.contracts(id);


--
-- TOC entry 5608 (class 2606 OID 17664)
-- Name: contract_signatures contract_signatures_user_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_signatures
    ADD CONSTRAINT contract_signatures_user_id_fkey FOREIGN KEY (user_id) REFERENCES nexa.users(id);


--
-- TOC entry 5622 (class 2606 OID 17899)
-- Name: contract_versions contract_versions_contract_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_versions
    ADD CONSTRAINT contract_versions_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES nexa.contracts(id) ON DELETE CASCADE;


--
-- TOC entry 5623 (class 2606 OID 17904)
-- Name: contract_versions contract_versions_created_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contract_versions
    ADD CONSTRAINT contract_versions_created_by_fkey FOREIGN KEY (created_by) REFERENCES nexa.users(id);


--
-- TOC entry 5605 (class 2606 OID 17636)
-- Name: contracts contracts_created_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contracts
    ADD CONSTRAINT contracts_created_by_fkey FOREIGN KEY (created_by) REFERENCES nexa.users(id);


--
-- TOC entry 5606 (class 2606 OID 17631)
-- Name: contracts contracts_project_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.contracts
    ADD CONSTRAINT contracts_project_id_fkey FOREIGN KEY (project_id) REFERENCES nexa.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5619 (class 2606 OID 17872)
-- Name: demand_assignees demand_assignees_assigned_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_assignees
    ADD CONSTRAINT demand_assignees_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES nexa.users(id);


--
-- TOC entry 5620 (class 2606 OID 17862)
-- Name: demand_assignees demand_assignees_demand_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_assignees
    ADD CONSTRAINT demand_assignees_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES nexa.demands(id) ON DELETE CASCADE;


--
-- TOC entry 5621 (class 2606 OID 17867)
-- Name: demand_assignees demand_assignees_user_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_assignees
    ADD CONSTRAINT demand_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES nexa.users(id) ON DELETE CASCADE;


--
-- TOC entry 5603 (class 2606 OID 17600)
-- Name: demand_files demand_files_demand_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_files
    ADD CONSTRAINT demand_files_demand_id_fkey FOREIGN KEY (demand_id) REFERENCES nexa.demands(id) ON DELETE CASCADE;


--
-- TOC entry 5604 (class 2606 OID 17605)
-- Name: demand_files demand_files_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demand_files
    ADD CONSTRAINT demand_files_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES nexa.users(id);


--
-- TOC entry 5601 (class 2606 OID 17573)
-- Name: demands demands_created_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demands
    ADD CONSTRAINT demands_created_by_fkey FOREIGN KEY (created_by) REFERENCES nexa.users(id);


--
-- TOC entry 5602 (class 2606 OID 17568)
-- Name: demands demands_project_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.demands
    ADD CONSTRAINT demands_project_id_fkey FOREIGN KEY (project_id) REFERENCES nexa.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5613 (class 2606 OID 17755)
-- Name: financial_entries financial_entries_created_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.financial_entries
    ADD CONSTRAINT financial_entries_created_by_fkey FOREIGN KEY (created_by) REFERENCES nexa.users(id);


--
-- TOC entry 5614 (class 2606 OID 17964)
-- Name: financial_entries financial_entries_paid_by_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.financial_entries
    ADD CONSTRAINT financial_entries_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES nexa.users(id);


--
-- TOC entry 5615 (class 2606 OID 17750)
-- Name: financial_entries financial_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.financial_entries
    ADD CONSTRAINT financial_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES nexa.projects(id);


--
-- TOC entry 5624 (class 2606 OID 17955)
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES nexa.users(id) ON DELETE CASCADE;


--
-- TOC entry 5616 (class 2606 OID 17782)
-- Name: professor_comments professor_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.professor_comments
    ADD CONSTRAINT professor_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES nexa.users(id);


--
-- TOC entry 5617 (class 2606 OID 17777)
-- Name: professor_comments professor_comments_target_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.professor_comments
    ADD CONSTRAINT professor_comments_target_id_fkey FOREIGN KEY (target_id) REFERENCES nexa.users(id);


--
-- TOC entry 5618 (class 2606 OID 17808)
-- Name: profitability_goals profitability_goals_user_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.profitability_goals
    ADD CONSTRAINT profitability_goals_user_id_fkey FOREIGN KEY (user_id) REFERENCES nexa.users(id) ON DELETE CASCADE;


--
-- TOC entry 5599 (class 2606 OID 17539)
-- Name: project_members project_members_project_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.project_members
    ADD CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES nexa.projects(id) ON DELETE CASCADE;


--
-- TOC entry 5600 (class 2606 OID 17544)
-- Name: project_members project_members_user_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.project_members
    ADD CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES nexa.users(id) ON DELETE CASCADE;


--
-- TOC entry 5597 (class 2606 OID 17513)
-- Name: projects projects_client_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.projects
    ADD CONSTRAINT projects_client_id_fkey FOREIGN KEY (client_id) REFERENCES nexa.users(id);


--
-- TOC entry 5598 (class 2606 OID 17508)
-- Name: projects projects_owner_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.projects
    ADD CONSTRAINT projects_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES nexa.users(id);


--
-- TOC entry 5611 (class 2606 OID 17724)
-- Name: ticket_responses ticket_responses_author_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.ticket_responses
    ADD CONSTRAINT ticket_responses_author_id_fkey FOREIGN KEY (author_id) REFERENCES nexa.users(id);


--
-- TOC entry 5612 (class 2606 OID 17719)
-- Name: ticket_responses ticket_responses_ticket_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.ticket_responses
    ADD CONSTRAINT ticket_responses_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES nexa.tickets(id) ON DELETE CASCADE;


--
-- TOC entry 5609 (class 2606 OID 17698)
-- Name: tickets tickets_creator_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.tickets
    ADD CONSTRAINT tickets_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES nexa.users(id);


--
-- TOC entry 5610 (class 2606 OID 17693)
-- Name: tickets tickets_project_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.tickets
    ADD CONSTRAINT tickets_project_id_fkey FOREIGN KEY (project_id) REFERENCES nexa.projects(id);


--
-- TOC entry 5596 (class 2606 OID 17441)
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: nexa; Owner: postgres
--

ALTER TABLE ONLY nexa.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES nexa.users(id) ON DELETE CASCADE;


--
-- TOC entry 5833 (class 3256 OID 18118)
-- Name: audit_logs audit_insert; Type: POLICY; Schema: audit; Owner: postgres
--

CREATE POLICY audit_insert ON audit.audit_logs FOR INSERT TO nexa_app_role WITH CHECK (true);


--
-- TOC entry 5814 (class 0 OID 17977)
-- Dependencies: 246
-- Name: audit_logs; Type: ROW SECURITY; Schema: audit; Owner: postgres
--

ALTER TABLE audit.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5822 (class 3256 OID 17990)
-- Name: audit_logs audit_no_delete; Type: POLICY; Schema: audit; Owner: postgres
--

CREATE POLICY audit_no_delete ON audit.audit_logs FOR DELETE TO nexa_app_role USING (false);


--
-- TOC entry 5821 (class 3256 OID 17989)
-- Name: audit_logs audit_no_update; Type: POLICY; Schema: audit; Owner: postgres
--

CREATE POLICY audit_no_update ON audit.audit_logs FOR UPDATE TO nexa_app_role USING (false);


--
-- TOC entry 5834 (class 3256 OID 18119)
-- Name: audit_logs audit_select; Type: POLICY; Schema: audit; Owner: postgres
--

CREATE POLICY audit_select ON audit.audit_logs FOR SELECT TO nexa_auditor USING (true);


--
-- TOC entry 5807 (class 0 OID 17641)
-- Dependencies: 236
-- Name: contract_signatures; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.contract_signatures ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5806 (class 0 OID 17610)
-- Dependencies: 235
-- Name: contracts; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.contracts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5827 (class 3256 OID 18112)
-- Name: contracts contracts_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY contracts_select ON nexa.contracts FOR SELECT TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = ANY (ARRAY['NIVEL_2'::text, 'NIVEL_3'::text, 'PROFESSOR'::text])) OR (EXISTS ( SELECT 1
   FROM nexa.projects p
  WHERE ((p.id = contracts.project_id) AND ((p.client_id)::text = current_setting('app.current_user_id'::text, true)))))));


--
-- TOC entry 5812 (class 0 OID 17848)
-- Dependencies: 242
-- Name: demand_assignees; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.demand_assignees ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5815 (class 3256 OID 17879)
-- Name: demand_assignees demand_assignees_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY demand_assignees_select ON nexa.demand_assignees FOR SELECT TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = ANY (ARRAY['NIVEL_2'::text, 'NIVEL_3'::text, 'PROFESSOR'::text])) OR ((user_id)::text = current_setting('app.current_user_id'::text, true))));


--
-- TOC entry 5805 (class 0 OID 17549)
-- Dependencies: 233
-- Name: demands; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.demands ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5819 (class 3256 OID 17974)
-- Name: demands demands_delete; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY demands_delete ON nexa.demands FOR DELETE TO nexa_app_role USING ((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text));


--
-- TOC entry 5809 (class 0 OID 17729)
-- Dependencies: 239
-- Name: financial_entries; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.financial_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5829 (class 3256 OID 18114)
-- Name: financial_entries financial_insert; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY financial_insert ON nexa.financial_entries FOR INSERT TO nexa_app_role WITH CHECK ((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text));


--
-- TOC entry 5828 (class 3256 OID 18113)
-- Name: financial_entries financial_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY financial_select ON nexa.financial_entries FOR SELECT TO nexa_app_role USING ((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text));


--
-- TOC entry 5830 (class 3256 OID 18115)
-- Name: financial_entries financial_update; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY financial_update ON nexa.financial_entries FOR UPDATE TO nexa_app_role USING ((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text));


--
-- TOC entry 5835 (class 3256 OID 18120)
-- Name: profitability_goals goals_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY goals_select ON nexa.profitability_goals FOR SELECT TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text) OR ((user_id)::text = current_setting('app.current_user_id'::text, true))));


--
-- TOC entry 5813 (class 0 OID 17939)
-- Dependencies: 244
-- Name: notifications; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.notifications ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5816 (class 3256 OID 17962)
-- Name: notifications notifications_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY notifications_select ON nexa.notifications FOR SELECT TO nexa_app_role USING (((user_id)::text = current_setting('app.current_user_id'::text, true)));


--
-- TOC entry 5817 (class 3256 OID 17963)
-- Name: notifications notifications_update; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY notifications_update ON nexa.notifications FOR UPDATE TO nexa_app_role USING (((user_id)::text = current_setting('app.current_user_id'::text, true)));


--
-- TOC entry 5810 (class 0 OID 17760)
-- Dependencies: 240
-- Name: professor_comments; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.professor_comments ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5811 (class 0 OID 17787)
-- Dependencies: 241
-- Name: profitability_goals; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.profitability_goals ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5804 (class 0 OID 17520)
-- Dependencies: 232
-- Name: project_members; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.project_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5803 (class 0 OID 17489)
-- Dependencies: 231
-- Name: projects; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.projects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5826 (class 3256 OID 18111)
-- Name: projects projects_insert; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY projects_insert ON nexa.projects FOR INSERT TO nexa_app_role WITH CHECK (((current_setting('app.current_user_role'::text, true) = ANY (ARRAY['NIVEL_2'::text, 'NIVEL_3'::text])) AND ((owner_id)::text = current_setting('app.current_user_id'::text, true))));


--
-- TOC entry 5836 (class 3256 OID 18168)
-- Name: projects projects_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY projects_select ON nexa.projects FOR SELECT TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = ANY (ARRAY['NIVEL_3'::text, 'PROFESSOR'::text])) OR ((current_setting('app.current_user_role'::text, true) = 'CLIENTE'::text) AND ((client_id)::text = current_setting('app.current_user_id'::text, true))) OR (EXISTS ( SELECT 1
   FROM (nexa.project_members pm
     JOIN nexa.projects proj ON ((proj.id = pm.project_id)))
  WHERE ((proj.id = projects.id) AND ((pm.user_id)::text = current_setting('app.current_user_id'::text, true)))))));


--
-- TOC entry 5820 (class 3256 OID 17975)
-- Name: contract_signatures signatures_no_delete; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY signatures_no_delete ON nexa.contract_signatures FOR DELETE TO nexa_app_role USING (false);


--
-- TOC entry 5808 (class 0 OID 17674)
-- Dependencies: 237
-- Name: tickets; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.tickets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5818 (class 3256 OID 17973)
-- Name: tickets tickets_delete; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY tickets_delete ON nexa.tickets FOR DELETE TO nexa_app_role USING ((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text));


--
-- TOC entry 5832 (class 3256 OID 18117)
-- Name: tickets tickets_insert; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY tickets_insert ON nexa.tickets FOR INSERT TO nexa_app_role WITH CHECK (true);


--
-- TOC entry 5831 (class 3256 OID 18116)
-- Name: tickets tickets_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY tickets_select ON nexa.tickets FOR SELECT TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = ANY (ARRAY['NIVEL_2'::text, 'NIVEL_3'::text])) OR ((creator_id)::text = current_setting('app.current_user_id'::text, true))));


--
-- TOC entry 5802 (class 0 OID 17395)
-- Dependencies: 229
-- Name: users; Type: ROW SECURITY; Schema: nexa; Owner: postgres
--

ALTER TABLE nexa.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 5824 (class 3256 OID 18108)
-- Name: users users_insert; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY users_insert ON nexa.users FOR INSERT TO nexa_app_role WITH CHECK ((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text));


--
-- TOC entry 5823 (class 3256 OID 18107)
-- Name: users users_select; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY users_select ON nexa.users FOR SELECT TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text) OR ((id)::text = current_setting('app.current_user_id'::text, true)) OR ((current_setting('app.current_user_role'::text, true) = 'PROFESSOR'::text) AND (role = ANY (ARRAY['NIVEL_1'::nexa.user_role, 'NIVEL_2'::nexa.user_role])))));


--
-- TOC entry 5825 (class 3256 OID 18109)
-- Name: users users_update; Type: POLICY; Schema: nexa; Owner: postgres
--

CREATE POLICY users_update ON nexa.users FOR UPDATE TO nexa_app_role USING (((current_setting('app.current_user_role'::text, true) = 'NIVEL_3'::text) OR ((id)::text = current_setting('app.current_user_id'::text, true))));


--
-- TOC entry 5866 (class 0 OID 0)
-- Dependencies: 13
-- Name: SCHEMA audit; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA audit TO nexa_app_role;
GRANT USAGE ON SCHEMA audit TO nexa_auditor;


--
-- TOC entry 5867 (class 0 OID 0)
-- Dependencies: 10
-- Name: SCHEMA monitoring; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA monitoring TO nexa_app_role;
GRANT USAGE ON SCHEMA monitoring TO nexa_auditor;


--
-- TOC entry 5868 (class 0 OID 0)
-- Dependencies: 12
-- Name: SCHEMA nexa; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA nexa TO nexa_app_role;
GRANT USAGE ON SCHEMA nexa TO nexa_readonly;


--
-- TOC entry 5869 (class 0 OID 0)
-- Dependencies: 11
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- TOC entry 5875 (class 0 OID 0)
-- Dependencies: 552
-- Name: FUNCTION fn_decrypt_cpf_cnpj(p_user_id uuid); Type: ACL; Schema: nexa; Owner: postgres
--

REVOKE ALL ON FUNCTION nexa.fn_decrypt_cpf_cnpj(p_user_id uuid) FROM PUBLIC;
GRANT ALL ON FUNCTION nexa.fn_decrypt_cpf_cnpj(p_user_id uuid) TO nexa_app_role;


--
-- TOC entry 5876 (class 0 OID 0)
-- Dependencies: 246
-- Name: TABLE audit_logs; Type: ACL; Schema: audit; Owner: postgres
--

GRANT INSERT ON TABLE audit.audit_logs TO nexa_app_role;
GRANT SELECT ON TABLE audit.audit_logs TO nexa_auditor;


--
-- TOC entry 5878 (class 0 OID 0)
-- Dependencies: 247
-- Name: TABLE audit_logs_default; Type: ACL; Schema: audit; Owner: postgres
--

GRANT SELECT ON TABLE audit.audit_logs_default TO nexa_auditor;


--
-- TOC entry 5879 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE backup_log; Type: ACL; Schema: monitoring; Owner: postgres
--

GRANT SELECT,INSERT ON TABLE monitoring.backup_log TO nexa_backup;


--
-- TOC entry 5881 (class 0 OID 0)
-- Dependencies: 251
-- Name: TABLE sla_alerts; Type: ACL; Schema: monitoring; Owner: postgres
--

GRANT SELECT,INSERT ON TABLE monitoring.sla_alerts TO nexa_app_role;
GRANT SELECT ON TABLE monitoring.sla_alerts TO nexa_auditor;


--
-- TOC entry 5883 (class 0 OID 0)
-- Dependencies: 249
-- Name: TABLE slow_query_log; Type: ACL; Schema: monitoring; Owner: postgres
--

GRANT SELECT,INSERT ON TABLE monitoring.slow_query_log TO nexa_app_role;
GRANT SELECT ON TABLE monitoring.slow_query_log TO nexa_auditor;


--
-- TOC entry 5885 (class 0 OID 0)
-- Dependencies: 236
-- Name: TABLE contract_signatures; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.contract_signatures TO nexa_app_role;
GRANT SELECT ON TABLE nexa.contract_signatures TO nexa_readonly;


--
-- TOC entry 5886 (class 0 OID 0)
-- Dependencies: 243
-- Name: TABLE contract_versions; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.contract_versions TO nexa_app_role;
GRANT SELECT ON TABLE nexa.contract_versions TO nexa_readonly;


--
-- TOC entry 5887 (class 0 OID 0)
-- Dependencies: 235
-- Name: TABLE contracts; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.contracts TO nexa_app_role;
GRANT SELECT ON TABLE nexa.contracts TO nexa_readonly;


--
-- TOC entry 5888 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE demand_assignees; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.demand_assignees TO nexa_app_role;
GRANT SELECT ON TABLE nexa.demand_assignees TO nexa_readonly;


--
-- TOC entry 5889 (class 0 OID 0)
-- Dependencies: 234
-- Name: TABLE demand_files; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.demand_files TO nexa_app_role;
GRANT SELECT ON TABLE nexa.demand_files TO nexa_readonly;


--
-- TOC entry 5890 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE demands; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.demands TO nexa_app_role;
GRANT SELECT ON TABLE nexa.demands TO nexa_readonly;


--
-- TOC entry 5891 (class 0 OID 0)
-- Dependencies: 239
-- Name: TABLE financial_entries; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.financial_entries TO nexa_app_role;
GRANT SELECT ON TABLE nexa.financial_entries TO nexa_readonly;


--
-- TOC entry 5892 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE notifications; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.notifications TO nexa_app_role;
GRANT SELECT ON TABLE nexa.notifications TO nexa_readonly;


--
-- TOC entry 5893 (class 0 OID 0)
-- Dependencies: 240
-- Name: TABLE professor_comments; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.professor_comments TO nexa_app_role;
GRANT SELECT ON TABLE nexa.professor_comments TO nexa_readonly;


--
-- TOC entry 5894 (class 0 OID 0)
-- Dependencies: 241
-- Name: TABLE profitability_goals; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.profitability_goals TO nexa_app_role;
GRANT SELECT ON TABLE nexa.profitability_goals TO nexa_readonly;


--
-- TOC entry 5895 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE project_members; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.project_members TO nexa_app_role;
GRANT SELECT ON TABLE nexa.project_members TO nexa_readonly;


--
-- TOC entry 5896 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE projects; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.projects TO nexa_app_role;
GRANT SELECT ON TABLE nexa.projects TO nexa_readonly;


--
-- TOC entry 5897 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE ticket_responses; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.ticket_responses TO nexa_app_role;
GRANT SELECT ON TABLE nexa.ticket_responses TO nexa_readonly;


--
-- TOC entry 5898 (class 0 OID 0)
-- Dependencies: 237
-- Name: TABLE tickets; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.tickets TO nexa_app_role;
GRANT SELECT ON TABLE nexa.tickets TO nexa_readonly;


--
-- TOC entry 5899 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE user_sessions; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.user_sessions TO nexa_app_role;
GRANT SELECT ON TABLE nexa.user_sessions TO nexa_readonly;


--
-- TOC entry 5900 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE users; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE nexa.users TO nexa_app_role;
GRANT SELECT ON TABLE nexa.users TO nexa_readonly;


--
-- TOC entry 5901 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE vw_financial_summary; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT ON TABLE nexa.vw_financial_summary TO nexa_app_role;


--
-- TOC entry 5902 (class 0 OID 0)
-- Dependencies: 254
-- Name: TABLE vw_team_productivity; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT ON TABLE nexa.vw_team_productivity TO nexa_app_role;


--
-- TOC entry 5903 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE vw_tickets_sla; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT ON TABLE nexa.vw_tickets_sla TO nexa_app_role;


--
-- TOC entry 5904 (class 0 OID 0)
-- Dependencies: 252
-- Name: TABLE vw_users_public; Type: ACL; Schema: nexa; Owner: postgres
--

GRANT SELECT ON TABLE nexa.vw_users_public TO nexa_app_role;


-- Completed on 2026-05-29 17:26:00

--
-- PostgreSQL database dump complete
--

\unrestrict 2FPLaIdvxAXVYBL8O97Zk3cDRIrRTsnJG291DlSap7pp8skYqLybdiJoptNvFpM

