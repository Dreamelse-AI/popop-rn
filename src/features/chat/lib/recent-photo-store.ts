import { Paths, File, Directory } from 'expo-file-system'

const PHOTO_DIR_NAME = 'recent-photos'
const MAX_RECENT_PHOTOS = 100

function getPhotoDir(): Directory {
  return new Directory(Paths.cache, PHOTO_DIR_NAME)
}

function getIndexFile(): File {
  return new File(getPhotoDir(), 'index.json')
}

export type RecentPhotoRecord = {
  id: string
  uri: string
  remoteUrl?: string
  bkgMainColor?: string
  createdAt: number
}

async function ensureDir() {
  const dir = getPhotoDir()
  if (!dir.exists) {
    dir.create()
  }
}

async function readIndex(): Promise<RecentPhotoRecord[]> {
  const indexFile = getIndexFile()
  if (!indexFile.exists) return []
  try {
    const raw = await indexFile.text()
    return JSON.parse(raw) as RecentPhotoRecord[]
  } catch {
    return []
  }
}

async function writeIndex(records: RecentPhotoRecord[]): Promise<void> {
  const indexFile = getIndexFile()
  indexFile.write(JSON.stringify(records))
}

export async function listRecentPhotoRecords(): Promise<RecentPhotoRecord[]> {
  await ensureDir()
  const records = await readIndex()
  return records.sort((a, b) => b.createdAt - a.createdAt)
}

export async function getRecentPhotoRecord(id: string): Promise<RecentPhotoRecord | null> {
  const records = await readIndex()
  return records.find(r => r.id === id) ?? null
}

export async function addRecentPhotoRecords(uris: string[]): Promise<RecentPhotoRecord[]> {
  if (uris.length === 0) return []

  await ensureDir()

  const createdAt = Date.now()
  const newRecords: RecentPhotoRecord[] = []

  for (let i = 0; i < uris.length; i++) {
    const id = `recent-${createdAt}-${i}`
    const source = new File(uris[i])
    const dest = new File(getPhotoDir(), `${id}.jpg`)
    source.copy(dest)
    newRecords.push({
      id,
      uri: dest.uri,
      createdAt: createdAt + i,
    })
  }

  const allRecords = [...newRecords, ...(await readIndex())]
  const trimmed = allRecords.slice(0, MAX_RECENT_PHOTOS)

  const stale = allRecords.slice(MAX_RECENT_PHOTOS)
  for (const record of stale) {
    try {
      const f = new File(record.uri)
      f.delete()
    } catch { /* ignore */ }
  }

  await writeIndex(trimmed)
  return newRecords
}

export async function updateRecentPhotoUploadResult(
  id: string,
  result: { remoteUrl: string; bkgMainColor?: string },
): Promise<void> {
  const records = await readIndex()
  const idx = records.findIndex(r => r.id === id)
  if (idx < 0) return

  records[idx] = { ...records[idx], remoteUrl: result.remoteUrl, bkgMainColor: result.bkgMainColor }
  await writeIndex(records)
}
