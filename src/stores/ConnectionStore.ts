import { makeAutoObservable, runInAction } from 'mobx';
import Peer, { DataConnection } from 'peerjs';
import type { ClientMessage, HostMessage } from '../types/protocol';
import { setupHostPeer, connectToHostPeer } from './connectionSetup';
import { createPeerForReconnect, startAutoReconnectLoop, stopAutoReconnectLoop } from './connectionUtils';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export class ConnectionStoreClass {
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
    return setupHostPeer(this, roomCode);
  }

  // CLIENT: connect to host
  connectToHost(roomCode: string): Promise<void> {
    return connectToHostPeer(this, roomCode);
  }

  // Set up data and close handlers on a client DataConnection
  setupClientConn(conn: DataConnection) {
    conn.on('data', (data) => {
      this.onHostMessage?.(data as HostMessage);
    });

    conn.on('close', () => {
      runInAction(() => {
        // Only react if this is still the active connection — a newer
        // connection may have replaced it (e.g. after heartbeat reconnect)
        if (this.hostConnection !== conn) return;
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
  startAutoReconnect() {
    startAutoReconnectLoop(this);
  }

  private stopAutoReconnect() {
    stopAutoReconnectLoop(this);
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
        createPeerForReconnect(this, roomCode);
      }
      return false;
    }
  }

  // CLIENT: heartbeat monitoring — detects host disconnect reliably
  startHeartbeatMonitor() {
    this.stopHeartbeatMonitor();
    this.lastHostPingAt = Date.now();
    this.heartbeatMonitor = setInterval(() => {
      if (this.status !== 'connected') return;
      if (Date.now() - this.lastHostPingAt > 15000) {
        // Host ping timeout — treat as disconnected
        const staleConn = this.hostConnection;
        runInAction(() => {
          this.hostConnection = null;
          this.status = 'reconnecting';
        });
        // Close the stale connection so its close handler doesn't
        // interfere with a future reconnection
        try { staleConn?.close(); } catch { /* ignore */ }
        this.startAutoReconnect();
      }
    }, 5000);
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
