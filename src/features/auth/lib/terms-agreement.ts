import type { AgreedTermsItem, TermsInfo } from '@/generated/arca_apiComponents'
import { agreeTerms } from '@/generated/arca_api'

import { applyAuthTokenOnly } from '../apply-auth-response'
import type { AuthResponse } from '../auth-types'
import { getRequiredTerms } from './app-terms'

function toAgreedItem(term: TermsInfo): AgreedTermsItem {
  return {
    terms_id: term.terms_id,
    ...(term.version ? { terms_version: term.version } : {}),
  }
}

/**
 * 根据勾选状态构建上报列表：
 * - 显式勾选（true）的条款上报
 * - 显式取消（false）的条款不上报
 * - 未显式操作但已同意且为必选的条款，按已同意处理
 */
export function buildAgreedTermsPayload(
  terms: TermsInfo[],
  checks: Partial<Record<string, boolean>>,
  agreed?: boolean,
): AgreedTermsItem[] {
  return terms
    .filter(term => {
      if (!term.terms_id) return false
      if (checks[term.terms_id] === true) return true
      if (checks[term.terms_id] === false) return false
      return Boolean(agreed && term.required)
    })
    .map(toAgreedItem)
}

/** 汇总最终上报列表：优先勾选结果，否则回退到必选条款，再退到全部条款 */
export function resolveTermsListForSubmit(
  terms: TermsInfo[],
  checks: Partial<Record<string, boolean>>,
): AgreedTermsItem[] {
  const fromChecks = buildAgreedTermsPayload(terms, checks, true)
  if (fromChecks.length > 0) return fromChecks

  const required = getRequiredTerms(terms)
  if (required.length > 0) return required.map(toAgreedItem)

  return terms.filter(term => Boolean(term.terms_id)).map(toAgreedItem)
}

/**
 * 登录拿到 JWT 后上报用户同意的条款。
 * /app/agree_terms 需鉴权，故先写入 token；上报失败不阻断登录流程。
 */
export async function submitAgreementAfterAuth(
  authRes: AuthResponse,
  terms: TermsInfo[],
  checks: Partial<Record<string, boolean>>,
): Promise<boolean> {
  const termsList = resolveTermsListForSubmit(terms, checks)
  if (termsList.length === 0) {
    console.warn('[auth] agreeTerms skipped: empty terms_list')
    return false
  }

  applyAuthTokenOnly(authRes)
  try {
    await agreeTerms({ terms_list: termsList })
    return true
  } catch (e) {
    console.error('[auth] agreeTerms failed:', e)
    return false
  }
}
