class ChecklistItem {
    constructor({ text = '', checked = false, subItems = [], marked = false } = {}) {
      this.text = text;
      this.checked = checked;
      this.marked = marked;
      this.subItems = subItems.map(subItem => new ChecklistSubItem(subItem));
    }
  
    addSubItem(text = '') {
      this.subItems.push(new ChecklistSubItem({ text }));
      this.updateState();
    }
  
    deleteSubItem(index) {
      this.subItems.splice(index, 1);
      this.updateState();
    }
  
    toggleCheck() {
      this.marked = false;
      this.checked = !this.checked;
      this.subItems.forEach(subItem => {
        subItem.checked = this.checked;
        subItem.marked = false;
      });
    }
  
    toggleMark() {
      this.marked = !this.marked;
      this.checked = false;
      this.subItems.forEach(subItem => {
        subItem.marked = this.marked;
        subItem.checked = false;
      });
    }
  
    updateState() {
      if (!this.subItems.length) return;
  
      const allMarked = this.subItems.every(sub => sub.marked);
      const allChecked = this.subItems.every(sub => sub.checked && !sub.marked);
      const anyMarkedOrChecked = this.subItems.some(sub => sub.marked || sub.checked);
  
      if (allMarked) {
        this.marked = true;
        this.checked = false;
      } else if (allChecked) {
        this.checked = true;
        this.marked = false;
      } else if (anyMarkedOrChecked) {
        this.checked = null;
        this.marked = false;
      } else {
        this.checked = false;
        this.marked = false;
      }
    }
  
    resetChecks() {
      this.checked = false;
      this.marked = false;
      this.subItems.forEach(subItem => {
        subItem.checked = false;
        subItem.marked = false;
      });
    }
  
    toJSON() {
      return {
        text: this.text,
        checked: this.checked,
        marked: this.marked,
        subItems: this.subItems.map(subItem => subItem.toJSON())
      };
    }
  }