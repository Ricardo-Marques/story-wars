import { createAvatar } from '@dicebear/core';
import { lorelei } from '@dicebear/collection';

export function getAvatarSvg(seed: string): string {
  const avatar = createAvatar(lorelei, {
    seed,
    size: 80,
  });
  return avatar.toString();
}

export function getAvatarDataUri(seed: string): string {
  const svg = getAvatarSvg(seed);
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function randomSeed(): string {
  return Math.random().toString(36).substring(2, 10);
}
