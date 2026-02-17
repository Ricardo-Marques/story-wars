import Peer from 'peerjs';
import { runInAction } from 'mobx';
import { peerIdFromCode } from '../utils/roomCode';
import type { ClientMessage } from '../types/protocol';
import type { ConnectionStoreClass } from './ConnectionStore';

/**
 * HOST: create peer with the room code ID and wire incoming connection handlers.
 */
export function setupHostPeer(store: ConnectionStoreClass, roomCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    runInAction(() => {
      store.status = 'connecting';
      store.roomCode = roomCode;
    });

    const peerId = peerIdFromCode(roomCode);
    const peer = new Peer(peerId);

    peer.on('open', () => {
      runInAction(() => {
        store.peer = peer;
        store.status = 'connected';
      });
      resolve();
    });

    peer.on('connection', (conn) => {
      conn.on('open', () => {
        // Don't register yet—wait for JOIN message to get playerId
      });

      conn.on('data', (data) => {
        const msg = data as ClientMessage;
        if ((msg.type === 'JOIN' || msg.type === 'REJOIN') && !store.connToPlayer.has(conn)) {
          const playerId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          store.clientConnections.set(playerId, conn);
          store.connToPlayer.set(conn, playerId);
        }
        const playerId = store.connToPlayer.get(conn);
        if (playerId && store.onClientMessage) {
          store.onClientMessage(playerId, msg);
        }
      });

      conn.on('close', () => {
        const playerId = store.connToPlayer.get(conn);
        if (playerId) {
          store.clientConnections.delete(playerId);
          store.connToPlayer.delete(conn);
          store.onClientDisconnect?.(playerId);
        }
      });
    });

    peer.on('error', (err) => {
      runInAction(() => {
        store.status = 'error';
        store.errorMessage = err.message || 'Connection error';
      });
      reject(err);
    });
  });
}

/**
 * CLIENT: create peer and connect to host.
 */
export function connectToHostPeer(store: ConnectionStoreClass, roomCode: string): Promise<void> {
  return new Promise((resolve, reject) => {
    runInAction(() => {
      store.status = 'connecting';
      store.roomCode = roomCode;
    });

    const peer = new Peer();

    peer.on('open', () => {
      runInAction(() => { store.peer = peer; });
      const hostPeerId = peerIdFromCode(roomCode);
      const conn = peer.connect(hostPeerId, { reliable: true });

      conn.on('open', () => {
        runInAction(() => {
          store.hostConnection = conn;
          store.status = 'connected';
        });
        resolve();
      });

      store.setupClientConn(conn);

      conn.on('error', (err) => {
        runInAction(() => {
          store.status = 'error';
          store.errorMessage = err.message || 'Connection error';
        });
        reject(err);
      });
    });

    peer.on('error', (err) => {
      runInAction(() => {
        store.status = 'error';
        store.errorMessage = err.message || 'Failed to connect';
      });
      reject(err);
    });
  });
}
