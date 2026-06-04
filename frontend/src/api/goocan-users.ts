import { clearStoredGoocanAuth, getStoredGoocanAuth } from './goocan-login'

type Periphery<T> = {
  n: T
  a?: Record<string, any>
  v?: Record<string, any>
}

type PeripheryResponse<T> = {
  n?: T
  data?: T
  message?: string
  msg?: string
  r?: {
    result?: string
    message?: string
    sub_message?: string
  }
}

export interface GoocanUserPickerNode {
  node_id?: string
  node_middle_id?: string
  node_tree_id?: string
  node_tree_name?: string
  node_type?: string
  node_name?: string
  node_number?: string
  user_avatar?: string
  avatar?: string
  head_img?: string
  head_url?: string
  photo?: string
  photo_url?: string
  user_head?: string
  user_ding_id?: string
  user_dept_name?: string
  name?: string
  job_number?: string
  sign?: string
}

function getGatewayURL() {
  return String(import.meta.env.VITE_GOOCAN_GATEWAY_URL || '').replace(/\/+$/, '')
}

export function getGoocanPickerDefaultCorpId() {
  return String(import.meta.env.VITE_GOOCAN_DEFAULT_CORP_ID || '')
}

export function getGoocanPickerProjectId() {
  return String(import.meta.env.VITE_GOOCAN_PROJECT_ID || '')
}

function normalizeGoocanImageURL(value: unknown): string {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^(https?:)?\/\//i.test(raw) || /^(data|blob):/i.test(raw)) {
    return raw.startsWith('//') ? `https:${raw}` : raw
  }
  const gateway = getGatewayURL()
  if (!gateway) return raw
  return raw.startsWith('/') ? `${gateway}${raw}` : `${gateway}/${raw}`
}

function normalizeGoocanNode(node: GoocanUserPickerNode): GoocanUserPickerNode {
  const avatar =
    node.user_avatar ||
    node.avatar ||
    node.head_img ||
    node.head_url ||
    node.photo ||
    node.photo_url ||
    node.user_head
  return {
    ...node,
    user_avatar: normalizeGoocanImageURL(avatar),
  }
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
    if (payload.r.result === '2') {
      clearStoredGoocanAuth()
    }
    throw new Error(payload.r.sub_message || payload.r.message || 'Goocan request failed')
  }
  return (payload.n ?? payload.data ?? payload) as TResp
}

export async function queryGoocanUserTree(params: {
  keyword?: string
  queryLikeType?: number
  queryType?: string
  deptId?: string
  corpId?: string
  projectId?: string
}): Promise<GoocanUserPickerNode[]> {
  const keyword = params.keyword?.trim() || ''
  const auth = getStoredGoocanAuth()
  if (!auth?.session_id) {
    throw new Error('Goocan 登录态已过期，请重新登录后再选择成员')
  }

  const corpId = params.corpId || auth.corp_id || getGoocanPickerDefaultCorpId()
  const projectId = params.projectId || getGoocanPickerProjectId()
  const deptId = params.deptId?.trim() || ''
  const request: Record<string, any> = {
    query_type: params.queryType || '1494',
    out_organ_id: corpId,
    corp_id: corpId,
    project_id: projectId,
    out_user_status: ['3969'],
  }
  if (deptId) {
    request.dept_id = deptId
  } else {
    request.node_name = keyword
    if (keyword) {
      request.query_like_type = String(params.queryLikeType ?? 4289)
    }
  }

  const payload = await postGoocan('/unify_users/user/tree/info/query_plus', {
    n: request,
    a: { source: '3' },
    v: {
      session_id: auth.session_id,
      access_token: auth.access_token,
    },
  })
  if (Array.isArray(payload)) {
    return (payload as GoocanUserPickerNode[]).map(normalizeGoocanNode)
  }
  const record = payload as Record<string, any>
  if (Array.isArray(record?.n)) {
    return (record.n as GoocanUserPickerNode[]).map(normalizeGoocanNode)
  }
  if (Array.isArray(record?.data)) {
    return (record.data as GoocanUserPickerNode[]).map(normalizeGoocanNode)
  }
  return []
}
