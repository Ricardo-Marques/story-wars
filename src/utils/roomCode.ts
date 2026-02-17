const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code);
}

export function peerIdFromCode(code: string): string {
  return `storywars-${code}`;
}

export function codeFromPeerId(peerId: string): string {
  return peerId.replace('storywars-', '');
}
