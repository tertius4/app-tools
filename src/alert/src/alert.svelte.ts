type Config = { success?: string; error?: string; warning?: string; info?: string; base?: string };

export class Alert {
  private base_hex: string = "#ffffff";
  private success_hex: string = "#497d00";
  private error_hex: string = "#fb2c36";
  private warning_hex: string = "#bb4d00";
  private info_hex: string = "#62748e";

  /**
   * @param {Object} param0
   * @param {string} param0.success - Hex color for success alerts (default: "oklch(72.3% 0.219 149.579)")
   * @param {string} param0.error - Hex color for error alerts (default: "oklch(63.7% 0.237 25.331)")
   * @param {string} param0.warning - Hex color for warning alerts (default: "oklch(79.5% 0.184 86.047)")
   * @param {string} param0.info - Hex color for info alerts (default: "oklch(55.4% 0.046 257.417)")
   */
  constructor({ success, error, warning, info, base }: Config = {}) {
    if (base) this.base_hex = base;
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
    alert_box.className = `fixed top-2 right-2 left-2 p-4 rounded shadow-lg`;

    // Use CSS custom properties instead of hardcoded colors
    alert_box.style.backgroundColor = 'var(--color-bg-2)';
    
    let typeColorVar: string;
    switch (type) {
      case "success":
        typeColorVar = 'var(--color-success)';
        break;
      case "error":
        typeColorVar = 'var(--color-error)';
        break;
      case "warning":
        typeColorVar = 'var(--color-warning)';
        break;
      case "info":
        typeColorVar = 'var(--color-primary)';
        break;
    }
    
    // Use the CSS variable directly
    alert_box.style.color = typeColorVar;
    alert_box.style.borderLeft = `4px solid ${typeColorVar}`;
    alert_box.style.backgroundColor = 'var(--color-bg-2)';

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
    close_butt.innerText = "×";
    close_butt.className = "absolute top-2 right-2 font-bold text-[32px] h-fit aspect-square leading-none";
    close_butt.onclick = () => {
      document.body.removeChild(alert_box);
    };
    alert_box.appendChild(close_butt);

    // Add to DOM
    document.body.appendChild(alert_box);
  }
}
