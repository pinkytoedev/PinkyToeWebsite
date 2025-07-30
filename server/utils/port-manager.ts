import net from 'net';
import { log } from '../vite';

/**
 * Check if a port is available
 */
export function isPortAvailable(port: number, host: string = '0.0.0.0'): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                resolve(false);
            } else {
                resolve(false);
            }
        });

        server.once('listening', () => {
            server.close();
            resolve(true);
        });

        server.listen(port, host);
    });
}

/**
 * Find an available port starting from the preferred port
 */
export async function findAvailablePort(
    preferredPort: number,
    maxAttempts: number = 10,
    host: string = '0.0.0.0'
): Promise<number> {
    for (let i = 0; i < maxAttempts; i++) {
        const port = preferredPort + i;
        const available = await isPortAvailable(port, host);

        if (available) {
            if (i > 0) {
                log(`Port ${preferredPort} was busy, using port ${port} instead`);
            }
            return port;
        } else if (i === 0) {
            log(`Port ${port} is already in use, trying alternatives...`);
        }
    }

    throw new Error(`Could not find an available port after ${maxAttempts} attempts starting from port ${preferredPort}`);
}

/**
 * Kill process using a specific port (Unix-like systems only)
 */
export async function killProcessOnPort(port: number): Promise<boolean> {
    if (process.platform === 'win32') {
        log('Automatic port cleanup is not supported on Windows');
        return false;
    }

    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        // Find the process using the port
        const { stdout } = await execAsync(`lsof -ti tcp:${port}`);
        const pid = stdout.trim();

        if (pid) {
            // Kill the process
            await execAsync(`kill -9 ${pid}`);
            log(`Killed process ${pid} that was using port ${port}`);
            return true;
        }
    } catch (error) {
        // Process might not exist or we don't have permissions
        return false;
    }

    return false;
}