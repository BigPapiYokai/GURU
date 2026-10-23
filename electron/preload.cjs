const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('guruElectron', {
  notify: (options: { title: string; body: string; sound?: 'alert' | 'match'; tag?: string }) =>
    ipcRenderer.invoke('guru:notify', options),
  playSound: (type: 'alert' | 'match') =>
    ipcRenderer.invoke('guru:play-sound', type),
  checkNotificationPermission: () =>
    ipcRenderer.invoke('guru:check-notification-permission'),
  onNotificationClick: (callback: (tag: string) => void) => {
    ipcRenderer.on('guru:notification-click', (_e, tag) => callback(tag));
    return () => ipcRenderer.removeAllListeners('guru:notification-click');
  },
});

declare global {
  interface Window {
    guruElectron: {
      notify: (options: { title: string; body: string; sound?: 'alert' | 'match'; tag?: string }) => Promise<{ success: boolean; error?: string }>;
      playSound: (type: 'alert' | 'match') => Promise<{ success: boolean; error?: string }>;
      checkNotificationPermission: () => Promise<boolean>;
      onNotificationClick: (callback: (tag: string) => void) => () => void;
    };
  }
}