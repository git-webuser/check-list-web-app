class ChecklistSubItem {
    constructor({ text = '', checked = false, marked = false } = {}) {
      this.text = text;
      this.checked = checked;
      this.marked = marked;
    }
  
    toggleCheck() {
      this.marked = false;
      this.checked = !this.checked;
    }
  
    toggleMark() {
      this.marked = !this.marked;
      this.checked = false;
    }
  
    toJSON() {
      return {
        text: this.text,
        checked: this.checked,
        marked: this.marked
      };
    }
  }
  
  export default ChecklistSubItem;