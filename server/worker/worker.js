import { parentPort } from 'worker_threads';
import { resolve } from 'path';

parentPort.on('message', (filePath) => {
    try {
        const resolvedPath = resolve(filePath);
        parentPort.postMessage(resolvedPath);
    } catch (error) {
        parentPort.postMessage({ error: error.message });
    }
});
