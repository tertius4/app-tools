export class Alert {
  private success_hex: string = "#00c951";
  private error_hex: string = "#fb2c36";
  private warning_hex: string = "#efb100";
  private info_hex: string = "#62748e";

  /**
   * @param {Object} param0
   * @param {string} param0.success - Hex color for success alerts (default: "oklch(72.3% 0.219 149.579)")
   * @param {string} param0.error - Hex color for error alerts (default: "oklch(63.7% 0.237 25.331)")
   * @param {string} param0.warning - Hex color for warning alerts (default: "oklch(79.5% 0.184 86.047)")
   * @param {string} param0.info - Hex color for info alerts (default: "oklch(55.4% 0.046 257.417)")
   */
  constructor({
    success,
    error,
    warning,
    info,
  }: { success?: string; error?: string; warning?: string; info?: string } = {}) {
    if (success) this.success_hex = success;
    if (error) this.error_hex = error;
    if (warning) this.warning_hex = warning;
    if (info) this.info_hex = info;
  }

  success(title: string, message?: string) {
    this.show({ type: "success", title: message ? title : undefined, message: message ?? title });
  }

  error(title: string, message?: string) {
    this.show({ type: "error", title: message ? title : undefined, message: message ?? title });
  }

  warning(title: string, message?: string) {
    this.show({ type: "warning", title: message ? title : undefined, message: message ?? title });
  }

  info(title: string, message?: string) {
    this.show({ type: "info", title: message ? title : undefined, message: message ?? title });
  }

  private show({ type, message, title }: { type: string; message: string; title?: string }) {
    if (typeof window === "undefined") {
      console.log(`[${type.toUpperCase()}] ${message}`);
      return;
    }

    // Add an alert box to the DOM (with tailwind).
    const alert_box = document.createElement("div");
    alert_box.className = `fixed top-2 right-2 left-2 w-full p-4 rounded shadow-lg text-black`;
    switch (type) {
      case "success":
        alert_box.style.backgroundColor = this.success_hex;
        break;
      case "error":
        alert_box.style.backgroundColor = this.error_hex;
        break;
      case "warning":
        alert_box.style.backgroundColor = this.warning_hex;
        break;
      case "info":
        alert_box.style.backgroundColor = this.info_hex;
        break;
      default:
        alert_box.style.backgroundColor = this.success_hex;
    }

    // Title
    if (title) {
      const title_element = document.createElement("div");
      title_element.className = "font-bold mb-2";
      title_element.innerText = title;
      alert_box.appendChild(title_element);
    }
    // Message
    const msg_element = document.createElement("div");
    msg_element.innerText = message;
    alert_box.appendChild(msg_element);

    // Show X button top right to close the alert.
    const close_butt = document.createElement("button");
    close_butt.innerText = "X";
    close_butt.className = "absolute top-1 right-2 font-bold";
    close_butt.onclick = () => {
      document.body.removeChild(alert_box);
    };
    alert_box.appendChild(close_butt);

    // Add to DOM
    document.body.appendChild(alert_box);
  }
}
