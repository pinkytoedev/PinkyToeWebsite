#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function checkPort(port) {
    if (!port) {
        console.error('Please provide a port number');
        console.log('Usage: node scripts/check-port.js <port>');
        process.exit(1);
    }

    console.log(`\nChecking port ${port}...\n`);

    try {
        if (process.platform === 'win32') {
            // Windows command
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            console.log('Port usage on Windows:');
            console.log(stdout);
        } else {
            // Unix-like systems
            try {
                const { stdout: lsofOutput } = await execAsync(`lsof -i :${port}`);
                console.log('Processes using port ' + port + ':');
                console.log(lsofOutput);
            } catch (error) {
                console.log(`Port ${port} appears to be free!`);
            }
        }
    } catch (error) {
        console.log(`Port ${port} appears to be free!`);
    }
}

const port = process.argv[2];
checkPort(port);