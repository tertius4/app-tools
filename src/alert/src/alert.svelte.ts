export class Alert {
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
    const alertBox = document.createElement("div");
    alertBox.className = `fixed top-2 right-2 left-2 w-full p-4 rounded shadow-lg text-black`;
    switch (type) {
      case "success":
        alertBox.classList.add("bg-green-200");
        break;
      case "error":
        alertBox.classList.add("bg-red-200");
        break;
      case "warning":
        alertBox.classList.add("bg-yellow-200");
        break;
      case "info":
        alertBox.classList.add("bg-blue-200");
        break;
      default:
        alertBox.classList.add("bg-gray-200");
    }

    // Title
    if (title) {
      const titleElem = document.createElement("div");
      titleElem.className = "font-bold mb-2";
      titleElem.innerText = title;
      alertBox.appendChild(titleElem);
    }
    // Message
    const messageElem = document.createElement("div");
    messageElem.innerText = message;
    alertBox.appendChild(messageElem);

    // Show X button top right to close the alert.
    const closeButton = document.createElement("button");
    closeButton.innerText = "X";
    closeButton.className = "absolute top-1 right-2 font-bold";
    closeButton.onclick = () => {
      document.body.removeChild(alertBox);
    };
    alertBox.appendChild(closeButton);

    // Add to DOM
    document.body.appendChild(alertBox);
  }
}
