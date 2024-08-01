import { parentPort } from 'worker_threads';

parentPort.on('message', (data) => {
    // Processa os dados recebidos
    const result = processData(data);
    // Envia o resultado de volta para o thread pai
    parentPort.postMessage(result);
});

function processData(data) {
    // Função para processar os dados
    return data; // Exemplo de processamento
}
