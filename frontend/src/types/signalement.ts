export type SignalementResponse = {
  id: number
  description?: string | null
  latitude: number
  longitude: number
  status: string
  surfaceM2?: number | null
  budget?: number | null
  entrepriseId?: number | null
  entrepriseNom?: string | null
  dateSignalement?: string | null
  dateModification?: string | null
  userId?: number | null
  userEmail?: string | null
}

export type SignalementCreateRequest = {
  description?: string | null
  latitude: number
  longitude: number
  surfaceM2?: number | null
  budget?: number | null
  entrepriseId?: number | null
  userId: number
}

export type SignalementUpdateRequest = {
  description?: string | null
  latitude?: number
  longitude?: number
  status?: string
  surfaceM2?: number | null
  budget?: number | null
  entrepriseId?: number | null
}
