type HoldItem = {
  id: string
  teamName: string
  description: string
  image: string
  status: string
  createdAt: string
  userLikesCount: number
  userApprovalsCount: number
  allApproved: boolean
}

type HoldStore = {
  items: Map<string, HoldItem>
}

declare global {
  // eslint-disable-next-line no-var
  var __WEB_HOLD_STORE__: HoldStore | undefined
}

function initStore(): HoldStore {
  if (!global.__WEB_HOLD_STORE__) {
    const items = new Map<string, HoldItem>()
    // seed with an example so UI shows something in dev
    const sample: HoldItem = {
      id: 'team_1756365611374_qo0nxj30c',
      teamName: '保留チームC',
      description: '保留中のチーム',
      image: 'https://via.placeholder.com/120x120/B8E5F7/FFFFFF?text=Team+C',
      status: 'hold',
      createdAt: new Date().toISOString(),
      userLikesCount: 0,
      userApprovalsCount: 0,
      allApproved: false,
    }
    items.set(sample.id, sample)
    global.__WEB_HOLD_STORE__ = { items }
  }
  return global.__WEB_HOLD_STORE__!
}

export function getHoldItems(): HoldItem[] {
  return Array.from(initStore().items.values())
}

export function removeFromHold(teamId: string) {
  initStore().items.delete(teamId)
}

