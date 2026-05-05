const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Można tu dodać API do komunikacji z procesem głównym
});
