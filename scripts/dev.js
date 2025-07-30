#!/usr/bin/env node

import { spawn } from 'child_process';
import net from 'net';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Check if a port is available
 */
function isPortAvailable(port) {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once('error', (err) => {
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

        server.listen(port, '0.0.0.0');
    });
}

/**
 * Get process using a port (Unix-like systems)
 */
async function getProcessUsingPort(port) {
    if (process.platform === 'win32') {
        return null;
    }

    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        const { stdout } = await execAsync(`lsof -i :${port} | grep LISTEN | awk '{print $2}'`);
        const pid = stdout.trim();

        if (pid) {
            const { stdout: processInfo } = await execAsync(`ps -p ${pid} -o comm=`);
            return { pid, command: processInfo.trim() };
        }
    } catch (error) {
        // Process might not exist
    }

    return null;
}

/**
 * Ask user what to do with busy port
 */
function askUserAction(port, processInfo) {
    return new Promise((resolve) => {
        console.log(`\n⚠️  Port ${port} is already in use${processInfo ? ` by ${processInfo.command} (PID: ${processInfo.pid})` : ''}.`);
        console.log('\nWhat would you like to do?');
        console.log('1. Use a different port (automatic)');
        console.log('2. Kill the process and use port ' + port);
        console.log('3. Exit\n');

        rl.question('Enter your choice (1-3): ', (answer) => {
            resolve(answer.trim());
        });
    });
}

/**
 * Kill process
 */
async function killProcess(pid) {
    try {
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        await execAsync(`kill -9 ${pid}`);
        console.log(`✅ Killed process ${pid}`);

        // Wait a bit for the port to be released
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    } catch (error) {
        console.error(`❌ Failed to kill process: ${error.message}`);
        return false;
    }
}

async function main() {
    const defaultPort = parseInt(process.env.PORT || '5000', 10);
    let port = defaultPort;

    // Check if default port is available
    const isAvailable = await isPortAvailable(port);

    if (!isAvailable) {
        const processInfo = await getProcessUsingPort(port);
        const choice = await askUserAction(port, processInfo);

        switch (choice) {
            case '1':
                // Find next available port
                for (let i = 1; i < 20; i++) {
                    const testPort = defaultPort + i;
                    if (await isPortAvailable(testPort)) {
                        port = testPort;
                        console.log(`\n✅ Using port ${port} instead`);
                        break;
                    }
                }
                break;

            case '2':
                if (processInfo) {
                    const killed = await killProcess(processInfo.pid);
                    if (!killed || !(await isPortAvailable(port))) {
                        console.log('Failed to free the port. Exiting...');
                        process.exit(1);
                    }
                } else {
                    console.log('Cannot identify the process using the port. Exiting...');
                    process.exit(1);
                }
                break;

            case '3':
            default:
                console.log('Exiting...');
                process.exit(0);
        }
    }

    rl.close();

    // Set the PORT environment variable
    process.env.PORT = port.toString();

    console.log(`\n🚀 Starting development server on port ${port}...\n`);

    // Start the server
    const server = spawn('tsx', ['server/index.ts'], {
        stdio: 'inherit',
        env: { ...process.env, PORT: port.toString() }
    });

    // Handle process termination
    process.on('SIGINT', () => {
        server.kill('SIGINT');
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        server.kill('SIGTERM');
        process.exit(0);
    });
}

main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
});