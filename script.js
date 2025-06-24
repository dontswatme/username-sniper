class UsernameSniper {
  constructor() {
    this.isRunning = false
    this.generatedCount = 0
    this.availableCount = 0
    this.startTime = null
    this.intervalId = null
    this.checkedUsernames = new Set()

    this.initializeElements()
    this.bindEvents()
    this.updateStats()
    this.showNotification(
      "⚠️ This tool generates usernames for you to manually check. Real API checking requires a server.",
    )
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
    } catch (error) {}
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
    } catch (error) {}
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

  generateSmartUsername(length) {
    const patterns = [
      () => {
        const prefixes = ["dark", "shadow", "fire", "ice", "neo", "cyber", "ghost", "storm", "void", "lunar"]
        const suffixes = ["wolf", "blade", "storm", "fire", "shadow", "ghost", "void", "star", "moon", "sun"]
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
        return prefix + suffix
      },
      () => {
        const words = ["epic", "pro", "legend", "master", "king", "lord", "ace", "elite", "prime", "ultra"]
        const numbers = ["1", "2", "3", "7", "9", "69", "420", "777", "999", "2024"]
        const word = words[Math.floor(Math.random() * words.length)]
        const num = numbers[Math.floor(Math.random() * numbers.length)]
        return word + num
      },
      () => {
        const adjectives = ["cool", "hot", "fast", "slow", "big", "small", "red", "blue", "green", "black"]
        const nouns = ["cat", "dog", "bird", "fish", "lion", "tiger", "bear", "wolf", "fox", "eagle"]
        const numbers = ["1", "2", "3", "7", "9", "10", "99", "100"]
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
        const noun = nouns[Math.floor(Math.random() * nouns.length)]
        const num = numbers[Math.floor(Math.random() * numbers.length)]
        return adj + noun + num
      },
      () => {
        const chars = "abcdefghijklmnopqrstuvwxyz"
        const nums = "0123456789"
        let result = chars[Math.floor(Math.random() * chars.length)]

        for (let i = 1; i < length - 1; i++) {
          if (Math.random() < 0.7) {
            result += chars[Math.floor(Math.random() * chars.length)]
          } else {
            result += nums[Math.floor(Math.random() * nums.length)]
          }
        }

        if (Math.random() < 0.5) {
          result += nums[Math.floor(Math.random() * nums.length)]
        } else {
          result += chars[Math.floor(Math.random() * chars.length)]
        }

        return result
      },
    ]

    let username = patterns[Math.floor(Math.random() * patterns.length)]()

    if (username.length > length) {
      username = username.substring(0, length)
    }

    while (username.length < length) {
      username += Math.floor(Math.random() * 10).toString()
    }

    return username.toLowerCase()
  }

  getSelectedPlatforms() {
    const platforms = ["roblox", "tiktok", "instagram", "youtube"]
    return platforms.filter((platform) => document.getElementById(platform).checked)
  }

  createCheckLinks(username, platforms) {
    const links = {
      roblox: `https://www.roblox.com/users/profile?username=${username}`,
      instagram: `https://www.instagram.com/${username}/`,
      tiktok: `https://www.tiktok.com/@${username}`,
      youtube: `https://www.youtube.com/@${username}`,
    }

    return platforms.map((platform) => ({
      platform,
      url: links[platform],
    }))
  }

  async sendToDiscord(username, platforms) {
    const webhookUrl = this.elements.webhookInput.value.trim()
    if (!webhookUrl) return

    const checkLinks = this.createCheckLinks(username, platforms)
    const linkText = checkLinks.map((link) => `[${link.platform}](${link.url})`).join(" | ")

    const embed = {
      title: "🎯 Username Generated!",
      description: `**${username}** - Click links to check availability:`,
      color: 0xff4757,
      fields: [
        {
          name: "Check Links",
          value: linkText,
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Bomb Studios Username Generator",
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

      this.showNotification(`Sent ${username} to Discord with check links!`)
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
    }, 5000)
  }

  addResult(username, platforms) {
    if (this.elements.resultsList.querySelector(".no-results")) {
      this.elements.resultsList.innerHTML = ""
    }

    const resultItem = document.createElement("div")
    resultItem.className = "result-item"
    resultItem.style.cursor = "pointer"

    const usernameEl = document.createElement("div")
    usernameEl.className = "result-username"
    usernameEl.textContent = username

    const platformsEl = document.createElement("div")
    platformsEl.className = "result-platforms"

    const checkLinks = this.createCheckLinks(username, platforms)

    checkLinks.forEach(({ platform, url }) => {
      const badge = document.createElement("a")
      badge.className = `platform-badge ${platform}`
      badge.textContent = platform
      badge.href = url
      badge.target = "_blank"
      badge.style.textDecoration = "none"
      badge.style.marginRight = "5px"
      badge.addEventListener("click", (e) => {
        e.stopPropagation()
        this.playButtonSound()
      })
      platformsEl.appendChild(badge)
    })

    resultItem.appendChild(usernameEl)
    resultItem.appendChild(platformsEl)

    resultItem.addEventListener("click", () => {
      navigator.clipboard
        .writeText(username)
        .then(() => {
          this.showNotification(`Copied ${username} to clipboard!`)
        })
        .catch(() => {
          this.showNotification(`${username} - copy manually`)
        })
    })

    this.elements.resultsList.insertBefore(resultItem, this.elements.resultsList.firstChild)

    const results = this.elements.resultsList.querySelectorAll(".result-item")
    if (results.length > 100) {
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

    let username
    let attempts = 0
    do {
      username = this.generateSmartUsername(length)
      attempts++
    } while (this.checkedUsernames.has(username) && attempts < 10)

    this.checkedUsernames.add(username)

    this.elements.currentUsername.textContent = `${username} (click links to check manually)`
    this.elements.currentUsername.style.color = "#ff4757"

    this.generatedCount++
    this.availableCount++

    this.addResult(username, platforms)
    this.sendToDiscord(username, platforms)

    this.updateStats()
  }

  updateStats() {
    this.elements.generatedCountEl.textContent = this.generatedCount.toLocaleString()
    this.elements.availableCountEl.textContent = this.generatedCount.toLocaleString()

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

    this.showNotification("Username generation started! Click usernames to copy, click badges to check!")
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

    this.showNotification("Username generation stopped!")
  }

  restartGeneration() {
    if (this.isRunning) {
      this.stopSniping()
      setTimeout(() => this.startSniping(), 100)
    }
  }

  clearResults() {
    this.elements.resultsList.innerHTML =
      '<div class="no-results">No usernames generated yet. Start generating to get ideas! 💎</div>'
    this.generatedCount = 0
    this.availableCount = 0
    this.startTime = null
    this.checkedUsernames.clear()
    this.updateStats()
    this.showNotification("Results cleared!")
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new UsernameSniper()
})
