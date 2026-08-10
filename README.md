# 📋 Kanban Task Manager

A minimalistic, TypeScript-powered Kanban board built to streamline project management and eliminate work-in-progress clutter.

---

## 📖 The Story Behind Kanban

Once upon a time, manufacturing operated on a **"Push System."** Management would mandate producing 1,000 car doors a month, so workers built them all and dumped them into storage—regardless of whether there were cars ready to receive them. 

This created massive problems:
* **Wasted Money & Space:** Capital locked up in excess inventory sitting idle in overcrowded warehouses.
* **Compounded Defects:** If a sizing error occurred, all 1,000 units became useless waste.
* **Chaos:** Workers rushed purely to hit production targets rather than fulfilling actual demand.

### The Supermarket Epiphany
Taiichi Ohno, an engineer at Toyota, noticed how U.S. supermarkets restocked shelves—only adding inventory after customers bought items. If a shelf was full, workers stopped adding products. 

### The Kanban Solution (The "Pull System")
Ohno adapted this idea for Toyota, transforming their operation into a **"Pull System"** using **Kanban** (visual cards):

* A worker assembling cars sends a Kanban card back to the door-making department only when they actually need another door.
* **No card? No production.** The door department stops working instead of overproducing.

The benefits were immediate:
1. **Zero Waste:** Production matched real-time demand (**Just-In-Time**).
2. **Fast Error Detection:** Flaws were caught on unit one, not unit 1,000.
3. **Smooth Flow:** Work moved seamlessly without bottlenecks or storage clutter.

Today, Kanban has evolved from manufacturing into software engineering. It prevents context-switching through one golden rule: **Stop starting, start finishing.**

---

## 🛠️ Features & Technical Stack

* **TypeScript:** Strong typing and strict compile-time checks.
* **LocalStorage Persistence:** State persists across browser sessions.
* **Full CRUD Operations:** Create, read, update, and delete tasks across workflow columns.
