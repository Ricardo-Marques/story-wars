import { makeAutoObservable, runInAction } from 'mobx';
import Peer, { DataConnection } from 'peerjs';
import { peerIdFromCode } from '../utils/roomCode';
import type { ClientMessage, HostMessage } from '../types/protocol';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

class ConnectionStoreClass {
  peer: Peer | null = null;
  status: ConnectionStatus = 'disconnected';
  errorMessage: string = '';

  // Host: map of playerId → connection, and reverse lookup
  clientConnections: Map<string, DataConnection> = new Map();
  connToPlayer: Map<DataConnection, string> = new Map();

  // Client: single connection to host
  hostConnection: DataConnection | null = null;

  // Stored for client auto-reconnect
  roomCode: string = '';
  reconnectTimer: ReturnType<typeof setInterval> | null = null;

  // Heartbeat monitoring (client-side)
  lastHostPingAt: number = 0;
  heartbeatMonitor: ReturnType<typeof setInterval> | null = null;

  // Callbacks
  onClientMessage: ((playerId: string, msg: ClientMessage) => void) | null = null;
  onHostMessage: ((msg: HostMessage) => void) | null = null;
  onClientDisconnect: ((playerId: string) => void) | null = null;
  onReconnected: (() => void) | null = null;

  constructor() {
    makeAutoObservable(this, {
      peer: false,
      clientConnections: false,
      connToPlayer: false,
      hostConnection: false,
      reconnectTimer: false,
      lastHostPingAt: false,
      heartbeatMonitor: false,
      onClientMessage: false,
      onHostMessage: false,
      onClientDisconnect: false,
      onReconnected: false,
    });

    // Destroy peer on page unload so PeerJS frees the ID promptly
    window.addEventListener('beforeunload', () => {
      this.peer?.destroy();
    });
  }

  // HOST: create peer and listen for connections
  createHost(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      runInAction(() => {
        this.status = 'connecting';
        this.roomCode = roomCode;
      });

      const peerId = peerIdFromCode(roomCode);
      const peer = new Peer(peerId);

      peer.on('open', () => {
        runInAction(() => {
          this.peer = peer;
          this.status = 'connected';
        });
        resolve();
      });

      peer.on('connection', (conn) => {
        conn.on('open', () => {
          // Don't register yet—wait for JOIN message to get playerId
        });

        conn.on('data', (data) => {
          const msg = data as ClientMessage;
          if ((msg.type === 'JOIN' || msg.type === 'REJOIN') && !this.connToPlayer.has(conn)) {
            const playerId = `p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            this.clientConnections.set(playerId, conn);
            this.connToPlayer.set(conn, playerId);
          }
          const playerId = this.connToPlayer.get(conn);
          if (playerId && this.onClientMessage) {
            this.onClientMessage(playerId, msg);
          }
        });

        conn.on('close', () => {
          const playerId = this.connToPlayer.get(conn);
          if (playerId) {
            this.clientConnections.delete(playerId);
            this.connToPlayer.delete(conn);
            this.onClientDisconnect?.(playerId);
          }
        });
      });

      peer.on('error', (err) => {
        runInAction(() => {
          this.status = 'error';
          this.errorMessage = err.message || 'Connection error';
        });
        reject(err);
      });
    });
  }

  // CLIENT: connect to host
  connectToHost(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      runInAction(() => {
        this.status = 'connecting';
        this.roomCode = roomCode;
      });

      const peer = new Peer();

      peer.on('open', () => {
        runInAction(() => { this.peer = peer; });
        const hostPeerId = peerIdFromCode(roomCode);
        const conn = peer.connect(hostPeerId, { reliable: true });

        conn.on('open', () => {
          runInAction(() => {
            this.hostConnection = conn;
            this.status = 'connected';
          });
          resolve();
        });

        this.setupClientConn(conn);

        conn.on('error', (err) => {
          runInAction(() => {
            this.status = 'error';
            this.errorMessage = err.message || 'Connection error';
          });
          reject(err);
        });
      });

      peer.on('error', (err) => {
        runInAction(() => {
          this.status = 'error';
          this.errorMessage = err.message || 'Failed to connect';
        });
        reject(err);
      });
    });
  }

  // Set up data and close handlers on a client DataConnection
  private setupClientConn(conn: DataConnection) {
    conn.on('data', (data) => {
      this.onHostMessage?.(data as HostMessage);
    });

    conn.on('close', () => {
      runInAction(() => {
        this.hostConnection = null;
        // Only auto-reconnect if we have a room code (active game)
        if (this.roomCode && this.peer?.open) {
          this.status = 'reconnecting';
          this.startAutoReconnect();
        } else {
          this.status = 'disconnected';
        }
      });
    });
  }

  // CLIENT: auto-reconnect to host after connection lost
  private startAutoReconnect() {
    if (this.reconnectTimer) return;

    const tryReconnect = () => {
      // Stop if already connected, intentionally disconnected, or peer is gone
      if (this.status === 'connected' || !this.peer?.open || !this.roomCode) {
        this.stopAutoReconnect();
        return;
      }

      const hostPeerId = peerIdFromCode(this.roomCode);
      const conn = this.peer.connect(hostPeerId, { reliable: true });

      // Timeout: if connection doesn't open in 5s, close and retry next interval
      const timeout = setTimeout(() => {
        try { conn.close(); } catch { /* ignore */ }
      }, 5000);

      conn.on('open', () => {
        clearTimeout(timeout);
        runInAction(() => {
          this.hostConnection = conn;
          this.status = 'connected';
        });
        this.setupClientConn(conn);
        this.stopAutoReconnect();
        this.onReconnected?.();
      });

      conn.on('error', () => {
        clearTimeout(timeout);
        // Will retry on next interval
      });
    };

    // Try immediately, then every 3 seconds
    tryReconnect();
    this.reconnectTimer = setInterval(tryReconnect, 3000);
  }

  private stopAutoReconnect() {
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // CLIENT: try to connect to host, fall back to auto-reconnect on failure
  async connectOrReconnect(roomCode: string): Promise<boolean> {
    try {
      await this.connectToHost(roomCode);
      return true;
    } catch {
      // connectToHost failed — peer may or may not be usable
      runInAction(() => {
        this.status = 'reconnecting';
        this.roomCode = roomCode;
      });
      if (this.peer?.open) {
        this.startAutoReconnect();
      } else {
        // Need a fresh peer for auto-reconnect
        this.createPeerForReconnect(roomCode);
      }
      return false;
    }
  }

  private createPeerForReconnect(roomCode: string) {
    const peer = new Peer();
    peer.on('open', () => {
      runInAction(() => { this.peer = peer; });
      this.roomCode = roomCode;
      this.startAutoReconnect();
    });
    peer.on('error', () => {
      // Retry creating peer after delay
      setTimeout(() => {
        if (this.status === 'reconnecting') {
          this.createPeerForReconnect(roomCode);
        }
      }, 3000);
    });
  }

  // CLIENT: heartbeat monitoring — detects host disconnect reliably
  startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.lastHostPingAt = Date.now();
    this.heartbeatMonitor = setInterval(() => {
      if (this.status !== 'connected') return;
      if (Date.now() - this.lastHostPingAt > 8000) {
        // Host ping timeout — treat as disconnected
        runInAction(() => {
          this.hostConnection = null;
          this.status = 'reconnecting';
        });
        this.startAutoReconnect();
      }
    }, 3000);
  }

  stopHeartbeatMonitor() {
    if (this.heartbeatMonitor) {
      clearInterval(this.heartbeatMonitor);
      this.heartbeatMonitor = null;
    }
  }

  handlePing() {
    this.lastHostPingAt = Date.now();
  }

  // HOST: send message to specific client
  sendToClient(playerId: string, msg: HostMessage): void {
    const conn = this.clientConnections.get(playerId);
    if (conn?.open) {
      conn.send(msg);
    }
  }

  // HOST: broadcast to all clients
  broadcast(msg: HostMessage): void {
    this.clientConnections.forEach((conn) => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  // CLIENT: send message to host
  sendToHost(msg: ClientMessage): void {
    if (this.hostConnection?.open) {
      this.hostConnection.send(msg);
    }
  }

  disconnect(): void {
    this.stopAutoReconnect();
    this.stopHeartbeatMonitor();
    this.peer?.destroy();
    runInAction(() => {
      this.peer = null;
      this.hostConnection = null;
      this.clientConnections.clear();
      this.connToPlayer.clear();
      this.status = 'disconnected';
      this.errorMessage = '';
      this.roomCode = '';
    });
  }
}

export const connectionStore = new ConnectionStoreClass();
