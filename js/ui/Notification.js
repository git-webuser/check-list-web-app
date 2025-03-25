class Notification {
    constructor() {
      this.container = document.getElementById('notification-container');
      this.notification = null;
    }
  
    show(message, duration = 3000) {
      if (this.notification) {
        this.hide();
      }
  
      this.notification = document.createElement('div');
      this.notification.className = 'notification';
      this.notification.textContent = message;
      this.container.appendChild(this.notification);
  
      setTimeout(() => {
        this.notification.classList.add('notification--show');
      }, 10);
  
      setTimeout(() => {
        this.hide();
      }, duration);
    }
  
    hide() {
      if (this.notification) {
        this.notification.classList.remove('notification--show');
        setTimeout(() => {
          this.notification.remove();
          this.notification = null;
        }, 300);
      }
    }
  }
  
  export default Notification;