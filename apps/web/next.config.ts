import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';

// Next's dev server refuses its own scripts to any origin but localhost, so a
// phone on the LAN gets server HTML that never hydrates. Allow this machine's
// LAN addresses, whatever they are today.
const lanAddresses = Object.values(networkInterfaces())
  .flatMap((nets) => nets ?? [])
  .filter((net) => net.family === 'IPv4' && !net.internal)
  .map((net) => net.address);

const config: NextConfig = {
  transpilePackages: ['@litmus/core'],
  allowedDevOrigins: lanAddresses,
};

export default config;
