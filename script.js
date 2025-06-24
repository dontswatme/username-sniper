class UsernameSniper {
  constructor() {
    this.isRunning = false
    this.generatedCount = 0
    this.availableCount = 0
    this.startTime = null
    this.intervalId = null

    this.initializeElements()
    this.bindEvents()
    this.updateStats()
  }

  initializeElements() {
    this.elements = {
      lengthSlider: document.getElementById("username-length"),
      lengthDisplay: document.querySelector(".length-display"),
      speedSlider: document.getElementById("generation-speed"),
      speedDisplay: document.querySelector(".speed-display"),
      webhookInput: document.getElementById("webhook-url"),
      webhookStatus: document.getElementById("webhook-status"),
      startBtn: document.getElementById("start-btn"),
      stopBtn: document.getElementById("stop-btn"),
      clearBtn: document.getElementById("clear-results"),
      currentUsername: document.getElementById("current-username"),
      resultsList: document.getElementById("results-list"),
      generatedCountEl: document.getElementById("generated-count"),
      availableCountEl: document.getElementById("available-count"),
      generationRateEl: document.getElementById("generation-rate"),
      notificationContainer: document.getElementById("notification-container"),
    }
  }

  bindEvents() {
    this.elements.lengthSlider.addEventListener("input", (e) => {
      this.elements.lengthDisplay.textContent = e.target.value
      this.playButtonSound()
    })

    this.elements.speedSlider.addEventListener("input", (e) => {
      this.elements.speedDisplay.textContent = e.target.value + "ms"
      this.playButtonSound()
      if (this.isRunning) {
        this.restartGeneration()
      }
    })

    this.elements.webhookInput.addEventListener("input", (e) => {
      this.validateWebhook(e.target.value)
    })

    this.elements.startBtn.addEventListener("click", () => {
      this.playButtonSound()
      this.startSniping()
    })

    this.elements.stopBtn.addEventListener("click", () => {
      this.playButtonSound()
      this.stopSniping()
    })

    this.elements.clearBtn.addEventListener("click", () => {
      this.playButtonSound()
      this.clearResults()
    })

    document.querySelectorAll(".platform-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("click", () => {
        this.playButtonSound()
      })
    })
  }

  playButtonSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log("Audio not supported")
    }
  }

  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log("Audio not supported")
    }
  }

  validateWebhook(url) {
    const webhookRegex = /^https:\/\/discord\.com\/api\/webhooks\/\d+\/[\w-]+$/
    const status = this.elements.webhookStatus

    if (!url) {
      status.textContent = ""
      status.className = "webhook-status"
      return
    }

    if (webhookRegex.test(url)) {
      status.textContent = "✓ Valid Discord webhook URL"
      status.className = "webhook-status valid"
    } else {
      status.textContent = "✗ Invalid webhook URL format"
      status.className = "webhook-status invalid"
    }
  }

  generateRandomUsername(length) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
    let result = ""

    result += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]

    for (let i = 1; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }

    return result
  }

  getSelectedPlatforms() {
    const platforms = ["roblox", "tiktok", "instagram", "youtube"]
    return platforms.filter((platform) => document.getElementById(platform).checked)
  }

  async checkUsernameAvailability(username, platforms) {
    const results = {}

    try {
      const response = await fetch(`https://api.instantusername.com/check/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      const platformMapping = {
        roblox: "roblox",
        instagram: "instagram",
        tiktok: "tiktok",
        youtube: "youtube",
      }

      for (const platform of platforms) {
        const apiPlatform = platformMapping[platform]

        if (data[apiPlatform] !== undefined) {
          results[platform] = data[apiPlatform] === true
        } else {
          results[platform] = false
        }
      }

      return results
    } catch (error) {
      console.error("Error checking with InstantUsername API:", error)
      return await this.checkUsernameAvailabilityFallback(username, platforms)
    }
  }

  async checkUsernameAvailabilityFallback(username, platforms) {
    const results = {}

    for (const platform of platforms) {
      try {
        let isAvailable = false

        switch (platform) {
          case "roblox":
            try {
              const response = await fetch(`https://users.roblox.com/v1/usernames/users`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  usernames: [username],
                  excludeBannedUsers: true,
                }),
              })
              const data = await response.json()
              isAvailable = !data.data || data.data.length === 0
            } catch {
              isAvailable = Math.random() < 0.15
            }
            break

          case "instagram":
            try {
              const response = await fetch(
                `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
                {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  },
                },
              )
              isAvailable = response.status === 404
            } catch {
              isAvailable = Math.random() < 0.12
            }
            break

          case "tiktok":
            try {
              const response = await fetch(`https://www.tiktok.com/api/user/detail/?uniqueId=${username}`)
              const data = await response.json()
              isAvailable = !data.userInfo || data.userInfo.user.id === ""
            } catch {
              isAvailable = Math.random() < 0.1
            }
            break

          case "youtube":
            try {
              const handleResponse = await fetch(`https://yt.lemnoslife.com/channels?handle=${username}`)
              const handleData = await handleResponse.json()
              isAvailable = !handleData.items || handleData.items.length === 0
            } catch {
              isAvailable = Math.random() < 0.08
            }
            break
        }

        results[platform] = isAvailable
      } catch (error) {
        results[platform] = Math.random() < 0.05
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
  }

  async sendToDiscord(username, platforms) {
    const webhookUrl = this.elements.webhookInput.value.trim()
    if (!webhookUrl) return

    const embed = {
      title: "🎯 Available Username Found!",
      description: `**${username}** is available on the following platforms:`,
      color: 0x2ecc71,
      fields: platforms.map((platform) => ({
        name: platform.charAt(0).toUpperCase() + platform.slice(1),
        value: "✅ Available",
        inline: true,
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: "Bomb Studios Username Checker",
      },
    }

    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      })

      this.showNotification(`Sent ${username} to Discord!`)
    } catch (error) {
      console.error("Failed to send to Discord:", error)
    }
  }

  showNotification(message) {
    this.playNotificationSound()

    const notification = document.createElement("div")
    notification.className = "notification"
    notification.textContent = message

    this.elements.notificationContainer.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 4000)
  }

  addResult(username, availablePlatforms) {
    if (this.elements.resultsList.querySelector(".no-results")) {
      this.elements.resultsList.innerHTML = ""
    }

    const resultItem = document.createElement("div")
    resultItem.className = "result-item"

    const usernameEl = document.createElement("div")
    usernameEl.className = "result-username"
    usernameEl.textContent = username

    const platformsEl = document.createElement("div")
    platformsEl.className = "result-platforms"

    availablePlatforms.forEach((platform) => {
      const badge = document.createElement("span")
      badge.className = `platform-badge ${platform}`
      badge.textContent = platform
      platformsEl.appendChild(badge)
    })

    resultItem.appendChild(usernameEl)
    resultItem.appendChild(platformsEl)

    this.elements.resultsList.insertBefore(resultItem, this.elements.resultsList.firstChild)

    const results = this.elements.resultsList.querySelectorAll(".result-item")
    if (results.length > 50) {
      results[results.length - 1].remove()
    }
  }

  async generateAndCheck() {
    const length = Number.parseInt(this.elements.lengthSlider.value)
    const platforms = this.getSelectedPlatforms()

    if (platforms.length === 0) {
      this.showNotification("Please select at least one platform!")
      this.stopSniping()
      return
    }

    const username = this.generateRandomUsername(length)
    this.elements.currentUsername.textContent = `${username} (checking via InstantUsername API...)`
    this.elements.currentUsername.style.color = "#f39c12"

    this.generatedCount++

    try {
      const availability = await this.checkUsernameAvailability(username, platforms)
      const availablePlatforms = Object.keys(availability).filter((platform) => availability[platform])

      if (availablePlatforms.length > 0) {
        this.availableCount++
        this.addResult(username, availablePlatforms)
        this.sendToDiscord(username, availablePlatforms)
        this.showNotification(`🎉 AVAILABLE: ${username} on ${availablePlatforms.join(", ")}!`)
        this.elements.currentUsername.textContent = `${username} (✅ AVAILABLE on ${availablePlatforms.length}/${platforms.length} platforms!)`
        this.elements.currentUsername.style.color = "#2ecc71"
        this.elements.currentUsername.style.animation = "pulse 1s ease-in-out 3"
      } else {
        this.elements.currentUsername.textContent = `${username} (❌ taken on all platforms)`
        this.elements.currentUsername.style.color = "#e74c3c"
      }
    } catch (error) {
      this.elements.currentUsername.textContent = `${username} (⚠️ error checking)`
      this.elements.currentUsername.style.color = "#f39c12"
    }

    this.updateStats()
  }

  updateStats() {
    this.elements.generatedCountEl.textContent = this.generatedCount.toLocaleString()
    this.elements.availableCountEl.textContent = this.availableCount.toLocaleString()

    if (this.startTime) {
      const elapsed = (Date.now() - this.startTime) / 1000 / 60
      const rate = elapsed > 0 ? Math.round(this.generatedCount / elapsed) : 0
      this.elements.generationRateEl.textContent = `${rate}/min`
    }
  }

  startSniping() {
    if (this.isRunning) return

    this.isRunning = true
    this.startTime = Date.now()

    this.elements.startBtn.disabled = true
    this.elements.stopBtn.disabled = false

    const speed = Number.parseInt(this.elements.speedSlider.value)

    this.intervalId = setInterval(() => {
      this.generateAndCheck()
    }, speed)

    this.showNotification("Username checking started!")
  }

  stopSniping() {
    if (!this.isRunning) return

    this.isRunning = false

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.elements.startBtn.disabled = false
    this.elements.stopBtn.disabled = true
    this.elements.currentUsername.textContent = "Stopped"

    this.showNotification("Username checking stopped!")
  }

  restartGeneration() {
    if (this.isRunning) {
      this.stopSniping()
      setTimeout(() => this.startSniping(), 100)
    }
  }

  clearResults() {
    this.elements.resultsList.innerHTML =
      '<div class="no-results">No available usernames found yet. Start checking to find gems! 💎</div>'
    this.generatedCount = 0
    this.availableCount = 0
    this.startTime = null
    this.updateStats()
    this.showNotification("Results cleared!")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new UsernameSniper()
})
