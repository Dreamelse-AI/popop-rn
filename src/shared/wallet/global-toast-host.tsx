import { Toast } from '@/shared/ui/toast'

import { useToastStore } from './toast-store'

export function GlobalToastHost() {
  const message = useToastStore(s => s.message)
  return <Toast message={message} />
}
