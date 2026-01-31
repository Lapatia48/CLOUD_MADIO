import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fileService } from '@/services/api'

export const useFilesStore = defineStore('files', () => {
  const files = ref<any[]>([])
  const loading = ref(false)
  const currentFolderId = ref<string | null>(null)

  async function fetchFiles(folderId?: string) {
    loading.value = true
    try {
      const res = await fileService.getFiles(folderId)
      files.value = res.data
      currentFolderId.value = folderId || null
    } catch { files.value = [] }
    finally { loading.value = false }
  }

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    if (currentFolderId.value) fd.append('folderId', currentFolderId.value)
    await fileService.uploadFile(fd)
    await fetchFiles(currentFolderId.value || undefined)
  }

  async function deleteFile(id: string) {
    await fileService.deleteFile(id)
    await fetchFiles(currentFolderId.value || undefined)
  }

  return { files, loading, currentFolderId, fetchFiles, uploadFile, deleteFile }
})
