export class Alert {
  success(message: string) {
    this.show({
      type: "success",
      message,
    });
  }

  error(message: string) {
    this.show({
      type: "error",
      message,
    });
  }

  warning(message: string) {
    this.show({
      type: "warning",
      message,
    });
  }

  info(message: string) {
    this.show({
      type: "info",
      message,
    });
  }

  private show({ type, message }: { type: string; message: string }) {
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
    
    alertBox.innerText = message;

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
