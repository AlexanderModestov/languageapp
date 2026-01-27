import WebApp from "@twa-dev/sdk"

export const isTelegramWebApp = () => {
  try {
    return !!WebApp.initData && WebApp.initData.length > 0
  } catch {
    return false
  }
}

export const initTelegramWebApp = () => {
  if (!isTelegramWebApp()) return

  try {
    // Expand to full height
    WebApp.expand()

    // Ready to show
    WebApp.ready()

    // Apply theme
    applyTelegramTheme()
  } catch (error) {
    console.error("Failed to initialize Telegram WebApp:", error)
  }
}

export const applyTelegramTheme = () => {
  if (!isTelegramWebApp()) return

  try {
    const themeParams = WebApp.themeParams

    if (themeParams) {
      const root = document.documentElement

      // Apply Telegram theme colors as CSS variables
      if (themeParams.bg_color) {
        root.style.setProperty("--tg-bg-color", themeParams.bg_color)
      }
      if (themeParams.text_color) {
        root.style.setProperty("--tg-text-color", themeParams.text_color)
      }
      if (themeParams.hint_color) {
        root.style.setProperty("--tg-hint-color", themeParams.hint_color)
      }
      if (themeParams.link_color) {
        root.style.setProperty("--tg-link-color", themeParams.link_color)
      }
      if (themeParams.button_color) {
        root.style.setProperty("--tg-button-color", themeParams.button_color)
      }
      if (themeParams.button_text_color) {
        root.style.setProperty("--tg-button-text-color", themeParams.button_text_color)
      }

      // Set dark mode if needed
      if (WebApp.colorScheme === "dark") {
        document.documentElement.classList.add("dark")
      }
    }
  } catch (error) {
    console.error("Failed to apply Telegram theme:", error)
  }
}

export const showMainButton = (text: string, onClick: () => void) => {
  if (!isTelegramWebApp()) return

  try {
    WebApp.MainButton.setText(text)
    WebApp.MainButton.onClick(onClick)
    WebApp.MainButton.show()
  } catch (error) {
    console.error("Failed to show MainButton:", error)
  }
}

export const hideMainButton = () => {
  if (!isTelegramWebApp()) return

  try {
    WebApp.MainButton.hide()
  } catch (error) {
    console.error("Failed to hide MainButton:", error)
  }
}

export const showBackButton = (onClick: () => void) => {
  if (!isTelegramWebApp()) return

  try {
    WebApp.BackButton.onClick(onClick)
    WebApp.BackButton.show()
  } catch (error) {
    console.error("Failed to show BackButton:", error)
  }
}

export const hideBackButton = () => {
  if (!isTelegramWebApp()) return

  try {
    WebApp.BackButton.hide()
  } catch (error) {
    console.error("Failed to hide BackButton:", error)
  }
}

export const hapticFeedback = (type: "light" | "medium" | "heavy" | "success" | "warning" | "error") => {
  if (!isTelegramWebApp()) return

  try {
    if (type === "success" || type === "warning" || type === "error") {
      WebApp.HapticFeedback.notificationOccurred(type)
    } else {
      WebApp.HapticFeedback.impactOccurred(type)
    }
  } catch (error) {
    console.error("Failed to trigger haptic feedback:", error)
  }
}
