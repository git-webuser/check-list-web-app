class Modal {
    constructor() {
      this.modals = {
        delete: document.getElementById('delete-modal'),
        warning: document.getElementById('warning-modal'),
        error: document.getElementById('error-modal'),
        reset: document.getElementById('reset-modal'),
        deleteSubItem: document.getElementById('delete-subitem-modal')
      };
    }
  
    open(modalName) {
      const modal = this.modals[modalName];
      if (modal) {
        modal.style.display = 'flex';
      }
    }
  
    close(modalName) {
      const modal = this.modals[modalName];
      if (modal) {
        modal.style.display = 'none';
      }
    }
  }
  
  export default Modal;