import { EventEmitter } from 'events'

export type UIVote = 'UNSET' | 'YES' | 'NO'

type VoteRecord = {
  byUser: Map<string, UIVote>
}

type VoteStore = {
  items: Map<string, VoteRecord>
  emitter: EventEmitter
}

declare global {
  // eslint-disable-next-line no-var
  var __WEB_VOTE_STORE__: VoteStore | undefined
}

function getStore(): VoteStore {
  if (!global.__WEB_VOTE_STORE__) {
    global.__WEB_VOTE_STORE__ = {
      items: new Map<string, VoteRecord>(),
      emitter: new EventEmitter(),
    }
    global.__WEB_VOTE_STORE__.emitter.setMaxListeners(1000)
  }
  return global.__WEB_VOTE_STORE__
}

export function setVote(itemId: string, userId: string, vote: UIVote) {
  const store = getStore()
  let rec = store.items.get(itemId)
  if (!rec) {
    rec = { byUser: new Map<string, UIVote>() }
    store.items.set(itemId, rec)
  }
  rec.byUser.set(userId, vote)

  const counts = getCounts(itemId)
  store.emitter.emit('vote:update', { itemId, userId, vote, counts })
  return counts
}

export function getCounts(itemId: string) {
  const store = getStore()
  const rec = store.items.get(itemId)
  if (!rec) return { likes: 0, rejects: 0, total: 0 }
  let likes = 0
  let rejects = 0
  for (const v of rec.byUser.values()) {
    if (v === 'YES') likes++
    if (v === 'NO') rejects++
  }
  return { likes, rejects, total: rec.byUser.size }
}

export function onUpdate(listener: (payload: any) => void) {
  const store = getStore()
  store.emitter.on('vote:update', listener)
  return () => store.emitter.off('vote:update', listener)
}

