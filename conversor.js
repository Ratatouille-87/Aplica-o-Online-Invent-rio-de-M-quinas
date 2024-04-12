document.addEventListener('DOMContentLoaded', function() {
    const content = document.getElementById('content');
    const fileInfo = document.getElementById('fileInfo');
    const fileInput = document.getElementById('fileInput');
    const convertButton = document.getElementById('convertButton');
    const processing = document.getElementById('processing');
    let file;

    // Prevenir comportamento padrão de arrastar e soltar para todo o corpo do documento
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Destacar a área de soltar ao arrastar o arquivo sobre ela
    ['dragenter', 'dragover'].forEach(eventName => {
        document.body.addEventListener(eventName, highlight, false);
    });

    // Remover destaque ao sair da área de soltar
    ['dragleave', 'drop'].forEach(eventName => {
        document.body.addEventListener(eventName, unhighlight, false);
    });

    // Lidar com o evento de soltar
    document.body.addEventListener('drop', handleDrop, false);

    // Lidar com o evento de clique no botão de conversão
    convertButton.addEventListener('click', convertToPDF, false);

    // Lidar com o evento de alteração do arquivo de entrada
    fileInput.addEventListener('change', handleFileSelect, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight() {
        document.body.classList.add('highlight');
    }

    function unhighlight() {
        document.body.classList.remove('highlight');
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
            file = files[0];
            // Atualizar o texto para mostrar o nome do arquivo
            fileInfo.textContent = `Arquivo selecionado: ${file.name}`;
            // Exibir o botão de conversão
            convertButton.style.display = 'block';
        }
    }

    function handleFileSelect(e) {
        file = e.target.files[0];
        // Atualizar o texto para mostrar o nome do arquivo
        fileInfo.textContent = `Arquivo selecionado: ${file.name}`;
        // Exibir o botão de conversão
        convertButton.style.display = 'block';
    }

    function convertToPDF() {
        if (file) {
            // Exibir a mensagem de processamento
            processing.style.display = 'block';

            // Enviar o arquivo para conversão
            enviarArquivoParaConversao(file);
        } else {
            alert('Nenhum arquivo selecionado.');
        }
    }

    function enviarArquivoParaConversao(file) {
        // Enviar o arquivo para o servidor
        const formData = new FormData();
        formData.append('file', file);

        fetch('/conversao', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (response.ok) {
                alert('Arquivo enviado para conversão com sucesso!');
                window.location.href = '/?mensagem=Arquivo convertido com sucesso.';
            } else {
                alert('Ocorreu um erro ao enviar o arquivo para conversão.');
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Ocorreu um erro ao enviar o arquivo para conversão.');
        })
        .finally(() => {
            // Ocultar a mensagem de processamento
            processing.style.display = 'none';
        });
    }
});
