import { md5 } from 'js-md5'

type Periphery<T> = {
  n: T
  a?: Record<string, any>
  v?: Record<string, any>
}

type PeripheryResponse<T> = {
  n?: T
  a?: Record<string, any>
  message?: string
  msg?: string
  r?: {
    result?: string
    message?: string
    sub_message?: string
  }
}

export interface GoocanLoginResponse {
  session_id: string
  access_token: string
  user_id: string
  user_code: string
  user_name: string
  user_email?: string
  user_avatar?: string
  role_type?: string
  corp_id?: string
  out_organ_id?: string
  project_id?: string
}

interface GetMd5KeyResponse {
  random_key: string
}

interface ConvertThirdResponse {
  corp_out_id: string
}

const GOOCAN_AUTH_STORAGE_KEY = 'datagoocan_goocan_auth'

export interface GoocanStoredAuth {
  session_id: string
  access_token?: string
  corp_id?: string
  project_id?: string
  user_id?: string
}

export function isGoocanLoginEnabled() {
  return String(import.meta.env.VITE_GOOCAN_LOGIN_ENABLED || '').toLowerCase() === 'true'
}

export function getGoocanDefaultCorpId() {
  return String(import.meta.env.VITE_GOOCAN_DEFAULT_CORP_ID || '')
}

export function getGoocanProjectId() {
  return String(import.meta.env.VITE_GOOCAN_PROJECT_ID || '')
}

function getGatewayURL() {
  return String(import.meta.env.VITE_GOOCAN_GATEWAY_URL || '').replace(/\/+$/, '')
}

async function postGoocan<TReq, TResp>(path: string, data: Periphery<TReq>): Promise<TResp> {
  const gateway = getGatewayURL()
  if (!gateway) {
    throw new Error('Goocan gateway is not configured')
  }
  const res = await fetch(`${gateway}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const payload = (await res.json().catch(() => ({}))) as PeripheryResponse<TResp>
  if (!res.ok) {
    throw new Error(payload?.message || payload?.msg || `Goocan request failed: ${res.status}`)
  }
  if (payload?.r && payload.r.result && payload.r.result !== '1') {
    throw new Error(payload.r.sub_message || payload.r.message || 'Goocan request failed')
  }
  if (payload?.n !== undefined) {
    return payload.n
  }
  return payload as TResp
}

export function saveGoocanAuth(data: GoocanLoginResponse, fallbackCorpId?: string) {
  if (typeof window === 'undefined' || !data.session_id) return
  const auth: GoocanStoredAuth = {
    session_id: data.session_id,
    access_token: data.access_token,
    corp_id: data.corp_id || data.out_organ_id || fallbackCorpId,
    project_id: data.project_id || getGoocanProjectId(),
    user_id: data.user_id,
  }
  localStorage.setItem(GOOCAN_AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function getStoredGoocanAuth(): GoocanStoredAuth | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(GOOCAN_AUTH_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as GoocanStoredAuth
    if (!parsed?.session_id) return null
    return parsed
  } catch {
    return null
  }
}

export function clearStoredGoocanAuth() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(GOOCAN_AUTH_STORAGE_KEY)
}

export async function loginWithGoocanPassword(params: {
  username: string
  password: string
  corpId: string
  projectId?: string
}): Promise<GoocanLoginResponse> {
  const projectId = params.projectId ?? getGoocanProjectId()
  const keyData = await postGoocan<
    { user_code: string; out_organ_id: string; project_id: string },
    GetMd5KeyResponse
  >('/unify_users/user/rsa/public/key/query', {
    n: {
      user_code: params.username,
      out_organ_id: params.corpId,
      project_id: projectId,
    },
    a: { source: '3' },
  })

  return postGoocan('/unify_users/user/login', {
    n: {
      user_code: params.username,
      user_pwd: md5(params.password + keyData.random_key),
      out_organ_id: params.corpId,
      corp_id: params.corpId,
      project_id: projectId,
      is_get_template: '1',
      is_get_dept: '1',
    },
    a: { source: '3' },
  })
}

export async function convertGoocanThird(params: {
  corpId: string
  projectId?: string
  source: string
}): Promise<ConvertThirdResponse> {
  return postGoocan('/unify_users/ding/app/info/goocan_convert_third', {
    n: {
      corp_id: params.corpId,
      project_id: params.projectId ?? getGoocanProjectId(),
      source: params.source,
    },
  })
}

export async function loginWithGoocanCode(params: {
  code: string
  corpId: string
  projectId?: string
  agentId?: string
}): Promise<GoocanLoginResponse> {
  return postGoocan('/unify_users/user/login_by_phone', {
    n: {
      code: params.code,
      corp_id: params.corpId,
      project_id: params.projectId ?? getGoocanProjectId(),
      agent_id: params.agentId,
    },
    a: {
      source: '3',
      agent_source: '4056',
    },
  })
}
