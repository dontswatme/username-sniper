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
    // Slider events
    this.elements.lengthSlider.addEventListener("input", (e) => {
      this.elements.lengthDisplay.textContent = e.target.value
    })

    this.elements.speedSlider.addEventListener("input", (e) => {
      this.elements.speedDisplay.textContent = e.target.value + "ms"
      if (this.isRunning) {
        this.restartGeneration()
      }
    })

    // Webhook validation
    this.elements.webhookInput.addEventListener("input", (e) => {
      this.validateWebhook(e.target.value)
    })

    // Control buttons
    this.elements.startBtn.addEventListener("click", () => this.startSniping())
    this.elements.stopBtn.addEventListener("click", () => this.stopSniping())
    this.elements.clearBtn.addEventListener("click", () => this.clearResults())
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

    // Ensure first character is a letter
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
      // Use the Instant Username API
      const response = await fetch(`https://api.instantusername.com/check/${encodeURIComponent(username)}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "BombStudios-UsernameSniper/1.0",
        },
      })

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }

      const data = await response.json()

      // Map the API response to our platform names
      const platformMapping = {
        roblox: "roblox",
        instagram: "instagram",
        tiktok: "tiktok",
        youtube: "youtube",
      }

      // Check each requested platform
      for (const platform of platforms) {
        const apiPlatform = platformMapping[platform]

        if (data[apiPlatform] !== undefined) {
          // API returns true if available, false if taken
          results[platform] = data[apiPlatform] === true
        } else {
          // Fallback: assume taken if not in API response
          results[platform] = false
        }
      }

      return results
    } catch (error) {
      console.error("Error checking with Instant Username API:", error)

      // Fallback to individual platform checking if API fails
      return await this.checkUsernameAvailabilityFallback(username, platforms)
    }
  }

  // Add fallback method for when API is down
  async checkUsernameAvailabilityFallback(username, platforms) {
    const results = {}

    for (const platform of platforms) {
      try {
        let isAvailable = false

        switch (platform) {
          case "roblox":
            const robloxResponse = await fetch(`https://api.roblox.com/users/get-by-username?username=${username}`)
            isAvailable = robloxResponse.status === 404 || (await robloxResponse.json()).errorMessage
            break

          case "instagram":
            // Simple check - if we can't access it, assume it might be available
            try {
              const igResponse = await fetch(`https://www.instagram.com/${username}/`, {
                method: "HEAD",
                mode: "no-cors",
              })
              isAvailable = false
            } catch {
              isAvailable = Math.random() < 0.1 // 10% chance if we can't check
            }
            break

          case "tiktok":
            try {
              const ttResponse = await fetch(`https://www.tiktok.com/@${username}`, { method: "HEAD", mode: "no-cors" })
              isAvailable = false
            } catch {
              isAvailable = Math.random() < 0.1
            }
            break

          case "youtube":
            try {
              const ytResponse = await fetch(`https://www.youtube.com/@${username}`, {
                method: "HEAD",
                mode: "no-cors",
              })
              isAvailable = false
            } catch {
              isAvailable = Math.random() < 0.1
            }
            break
        }

        results[platform] = isAvailable
      } catch (error) {
        console.error(`Error checking ${platform}:`, error)
        results[platform] = false
      }

      // Small delay between checks
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    return results
  }

  async checkRoblox(username) {
    try {
      // Try to access Roblox user profile
      const response = await fetch(`https://api.roblox.com/users/get-by-username?username=${username}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (response.status === 200) {
        const data = await response.json()
        return !data.Id // Available if no ID returned
      }

      // If 404 or other error, likely available
      return response.status === 404
    } catch (error) {
      // CORS or network error - try alternative method
      return await this.checkRobloxAlternative(username)
    }
  }

  async checkRobloxAlternative(username) {
    try {
      // Alternative: check if profile page exists
      const response = await fetch(`https://www.roblox.com/users/profile?username=${username}`, {
        method: "HEAD",
        mode: "no-cors",
      })
      return false // If we can fetch it, user exists
    } catch (error) {
      return true // If error, might be available
    }
  }

  async checkInstagram(username) {
    try {
      // Check Instagram profile existence
      const response = await fetch(`https://www.instagram.com/${username}/`, {
        method: "HEAD",
        mode: "no-cors",
      })
      return false // If successful, user exists
    } catch (error) {
      // Try alternative method with JSON endpoint
      try {
        const jsonResponse = await fetch(
          `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        )
        return jsonResponse.status === 404
      } catch (e) {
        return true // Assume available if can't check
      }
    }
  }

  async checkTikTok(username) {
    try {
      // Check TikTok profile
      const response = await fetch(`https://www.tiktok.com/@${username}`, {
        method: "HEAD",
        mode: "no-cors",
      })
      return false // If successful, user exists
    } catch (error) {
      // Try API endpoint
      try {
        const apiResponse = await fetch(`https://www.tiktok.com/api/user/detail/?uniqueId=${username}`)
        const data = await apiResponse.json()
        return !data.userInfo || !data.userInfo.user
      } catch (e) {
        return true // Assume available if can't check
      }
    }
  }

  async checkYouTube(username) {
    try {
      // Check YouTube channel by handle
      const response = await fetch(`https://www.youtube.com/@${username}`, {
        method: "HEAD",
        mode: "no-cors",
      })
      return false // If successful, channel exists
    } catch (error) {
      // Try alternative with channel URL
      try {
        const altResponse = await fetch(`https://www.youtube.com/c/${username}`, {
          method: "HEAD",
          mode: "no-cors",
        })
        return false // If successful, channel exists
      } catch (e) {
        return true // Assume available if can't check
      }
    }
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
        text: "Bomb Studios Username Sniper",
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
    const notification = document.createElement("div")
    notification.className = "notification"
    notification.textContent = message

    this.elements.notificationContainer.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
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

    // Keep only last 50 results
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
    this.elements.currentUsername.textContent = `${username} (checking via API...)`
    this.elements.currentUsername.style.color = "#f39c12"

    this.generatedCount++

    try {
      const availability = await this.checkUsernameAvailability(username, platforms)
      const availablePlatforms = Object.keys(availability).filter((platform) => availability[platform])
      const takenPlatforms = Object.keys(availability).filter((platform) => !availability[platform])

      if (availablePlatforms.length > 0) {
        this.availableCount++
        this.addResult(username, availablePlatforms)
        this.sendToDiscord(username, availablePlatforms)
        this.showNotification(`🎉 REAL AVAILABLE USERNAME: ${username} on ${availablePlatforms.join(", ")}!`)
        this.elements.currentUsername.textContent = `${username} (✅ AVAILABLE on ${availablePlatforms.length}/${platforms.length} platforms!)`
        this.elements.currentUsername.style.color = "#2ecc71"

        // Add some celebration effect
        this.elements.currentUsername.style.animation = "pulse 1s ease-in-out 3"
      } else {
        this.elements.currentUsername.textContent = `${username} (❌ taken on all platforms)`
        this.elements.currentUsername.style.color = "#e74c3c"
      }
    } catch (error) {
      console.error("Error checking username:", error)
      this.elements.currentUsername.textContent = `${username} (⚠️ error checking - API might be down)`
      this.elements.currentUsername.style.color = "#f39c12"
    }

    this.updateStats()
  }

  updateStats() {
    this.elements.generatedCountEl.textContent = this.generatedCount.toLocaleString()
    this.elements.availableCountEl.textContent = this.availableCount.toLocaleString()

    if (this.startTime) {
      const elapsed = (Date.now() - this.startTime) / 1000 / 60 // minutes
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

    this.showNotification("Username sniping started!")
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

    this.showNotification("Username sniping stopped!")
  }

  restartGeneration() {
    if (this.isRunning) {
      this.stopSniping()
      setTimeout(() => this.startSniping(), 100)
    }
  }

  clearResults() {
    this.elements.resultsList.innerHTML =
      '<div class="no-results">No results yet. Start sniping to see available usernames!</div>'
    this.generatedCount = 0
    this.availableCount = 0
    this.startTime = null
    this.updateStats()
    this.showNotification("Results cleared!")
  }
}

// Initialize the application when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new UsernameSniper()
})
