class Checklist {
    constructor() {
      this.title = 'Мой Чек-лист';
      this.items = [];
      this.isDirty = false;
      this.load();
    }
  
    load() {
      const savedData = localStorage.getItem('checklist');
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          this.title = data.title || this.title;
          this.items = data.items.map(itemData => new ChecklistItem(itemData));
          this.addEmptyItemIfNeeded();
        } catch (e) {
          console.error('Ошибка при загрузке данных:', e);
          this.reset();
        }
      } else {
        this.reset();
      }
    }
  
    save() {
      localStorage.setItem('checklist', JSON.stringify({
        title: this.title,
        items: this.items.filter(item => item.text).map(item => item.toJSON())
      }));
      this.isDirty = false;
    }
  
    reset() {
      this.title = 'Мой Чек-лист';
      this.items = [new ChecklistItem()];
      this.isDirty = true;
    }
  
    resetAllChecks() {
      this.items.forEach(item => item.resetChecks());
      this.isDirty = true;
    }
  
    addItem(text = '') {
      this.items.splice(this.items.length - 1, 0, new ChecklistItem({ text }));
      this.isDirty = true;
    }
  
    addEmptyItemIfNeeded() {
      if (!this.items.length || this.items[this.items.length - 1].text) {
        this.items.push(new ChecklistItem());
      }
    }
  
    deleteItem(index) {
      this.items.splice(index, 1);
      this.isDirty = true;
    }
  
    moveItem(fromIndex, toIndex) {
      const [item] = this.items.splice(fromIndex, 1);
      this.items.splice(toIndex, 0, item);
      this.isDirty = true;
    }
  }