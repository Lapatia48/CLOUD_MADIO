<template>
  <div class="notification-bell">
    <button class="bell-button" @click="toggleDropdown">
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </button>

    <div v-if="showDropdown" class="notification-dropdown">
      <div class="dropdown-header">
        <h4>Notifications</h4>
        <button v-if="unreadCount > 0" class="mark-all-read" @click="markAllAsRead">
          Tout lu
        </button>
      </div>

      <div class="notification-list">
        <p v-if="notifications.length === 0" class="no-notifications">
          Aucune notification
        </p>
        <div
          v-for="notif in notifications.slice(0, 10)"
          :key="notif.id"
          :class="['notification-item', { unread: !notif.isRead }]"
          @click="markAsRead(notif.id)"
        >
          <p class="notif-description">{{ notif.description }}</p>
          <span class="notif-date">{{ formatDate(notif.dateNotif) }}</span>
        </div>
      </div>
    </div>

    <!-- Overlay pour fermer -->
    <div v-if="showDropdown" class="dropdown-overlay" @click="showDropdown = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { http } from '../api/http'

interface Notification {
  id: number
  description: string
  signalementId?: number
  dateNotif: string
  isRead: boolean
}

const notifications = ref<Notification[]>([])
const showDropdown = ref(false)
let pollInterval: ReturnType<typeof setInterval> | null = null

const currentUser = computed(() => {
  const user = localStorage.getItem('user')
  if (user) {
    try {
      return JSON.parse(user)
    } catch {
      return null
    }
  }
  return null
})

const userId = computed(() => currentUser.value?.id || currentUser.value?.userId)

const unreadCount = computed(() => notifications.value.filter(n => !n.isRead).length)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

async function fetchNotifications() {
  if (!userId.value) return
  try {
    const response = await http.get(`/api/notifications/user/${userId.value}`)
    notifications.value = response.data
  } catch (error) {
    console.error('Erreur fetch notifications:', error)
  }
}

async function markAsRead(id: number) {
  try {
    await http.put(`/api/notifications/${id}/read`)
    fetchNotifications()
  } catch (error) {
    console.error('Erreur mark as read:', error)
  }
}

async function markAllAsRead() {
  if (!userId.value) return
  try {
    await http.put(`/api/notifications/user/${userId.value}/read-all`)
    fetchNotifications()
  } catch (error) {
    console.error('Erreur mark all as read:', error)
  }
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  return date.toLocaleDateString('fr-FR')
}

onMounted(() => {
  if (userId.value) {
    fetchNotifications()
    pollInterval = setInterval(fetchNotifications, 30000)
  }
})

onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval)
  }
})
</script>

<style scoped>
.notification-bell {
  position: relative;
}

.bell-button {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  font-size: 1.3rem;
  padding: 8px 12px;
  border-radius: 10px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
}

.bell-button:active {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(0.95);
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e74c3c;
  color: white;
  font-size: 0.65rem;
  font-weight: bold;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
}

.dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 10px;
  width: 300px;
  max-height: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  color: white;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 0.95rem;
}

.mark-all-read {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.5);
  color: white;
  padding: 4px 8px;
  border-radius: 5px;
  font-size: 0.7rem;
  cursor: pointer;
}

.mark-all-read:active {
  background: rgba(255, 255, 255, 0.2);
}

.notification-list {
  max-height: 280px;
  overflow-y: auto;
}

.no-notifications {
  padding: 25px;
  text-align: center;
  color: #7f8c8d;
  font-size: 0.85rem;
}

.notification-item {
  padding: 12px 15px;
  border-bottom: 1px solid #ecf0f1;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:active {
  background: #f8f9fa;
}

.notification-item.unread {
  background: #e8f4fd;
  border-left: 3px solid #3498db;
}

.notification-item.unread:active {
  background: #d4ecfb;
}

.notif-description {
  margin: 0 0 4px;
  font-size: 0.85rem;
  color: #2c3e50;
  line-height: 1.4;
}

.notif-date {
  font-size: 0.7rem;
  color: #7f8c8d;
}
</style>
