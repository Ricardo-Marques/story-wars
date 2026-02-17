import Peer from 'peerjs';
import { runInAction } from 'mobx';
import { peerIdFromCode } from '../utils/roomCode';
import type { ConnectionStoreClass } from './ConnectionStore';

/**
 * Create a fresh Peer for auto-reconnect when the existing peer is unusable.
 * Retries on error until status is no longer 'reconnecting'.
 */
export function createPeerForReconnect(store: ConnectionStoreClass, roomCode: string) {
  const peer = new Peer();
  peer.on('open', () => {
    runInAction(() => { store.peer = peer; });
    store.roomCode = roomCode;
    store.startAutoReconnect();
  });
  peer.on('error', () => {
    // Retry creating peer after delay
    setTimeout(() => {
      if (store.status === 'reconnecting') {
        createPeerForReconnect(store, roomCode);
      }
    }, 3000);
  });
}

/**
 * Auto-reconnect loop: tries to connect to the host every 3s.
 * Stops when connected, intentionally disconnected, or peer is gone.
 */
export function startAutoReconnectLoop(store: ConnectionStoreClass) {
  if (store.reconnectTimer) return;

  const tryReconnect = () => {
    // Stop if already connected, intentionally disconnected, or peer is gone
    if (store.status === 'connected' || !store.peer?.open || !store.roomCode) {
      stopAutoReconnectLoop(store);
      return;
    }

    const hostPeerId = peerIdFromCode(store.roomCode);
    const conn = store.peer.connect(hostPeerId, { reliable: true });

    // Timeout: if connection doesn't open in 5s, close and retry next interval
    const timeout = setTimeout(() => {
      try { conn.close(); } catch { /* ignore */ }
    }, 5000);

    conn.on('open', () => {
      clearTimeout(timeout);
      // Close stale connection before replacing to prevent its close
      // handler from interfering with the new connection
      const staleConn = store.hostConnection;
      if (staleConn && staleConn !== conn) {
        try { staleConn.close(); } catch { /* ignore */ }
      }
      runInAction(() => {
        store.hostConnection = conn;
        store.status = 'connected';
      });
      store.setupClientConn(conn);
      stopAutoReconnectLoop(store);
      store.onReconnected?.();
    });

    conn.on('error', () => {
      clearTimeout(timeout);
      // Will retry on next interval
    });
  };

  // Try immediately, then every 3 seconds
  tryReconnect();
  store.reconnectTimer = setInterval(tryReconnect, 3000);
}

export function stopAutoReconnectLoop(store: ConnectionStoreClass) {
  if (store.reconnectTimer) {
    clearInterval(store.reconnectTimer);
    store.reconnectTimer = null;
  }
}
