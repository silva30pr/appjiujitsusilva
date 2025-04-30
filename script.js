document.addEventListener('DOMContentLoaded', function() {
    // --- Referências aos Elementos ---
    const photoUploadInput = document.getElementById('photoUpload');
    const photoLabel = document.getElementById('photoLabel');
    const studentNameInput = document.getElementById('studentName');
    const studentBeltInput = document.getElementById('studentBelt');
    const beltColorSelector = document.getElementById('beltColorSelector');
    const beltDegreeSelector = document.getElementById('beltDegreeSelector');
    const trainingDateInput = document.getElementById('trainingDate');
    const classTimeSelect = document.getElementById('classTime');
    const finishTrainingButton = document.getElementById('finishTraining');
    const monthlyReportDiv = document.getElementById('monthlyReport');

    // --- Variáveis de Estado ---
    let currentPhotoDataUrl = null;
    let selectedBeltColor = '';
    let selectedBeltDegree = '';

    // --- Lógica de Upload de Foto ---
    photoUploadInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')){
                alert('Por favor, selecione um arquivo de imagem válido.');
                photoUploadInput.value = null; return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                photoLabel.style.backgroundImage = `url(${e.target.result})`;
                const icon = photoLabel.querySelector('svg');
                const text = photoLabel.querySelector('span');
                if (icon) icon.style.display = 'none';
                if (text) text.style.display = 'none';
                photoLabel.style.backgroundSize = 'cover';
                photoLabel.style.backgroundPosition = 'center';
                currentPhotoDataUrl = e.target.result;
            }
            reader.readAsDataURL(file);
        } else { resetPhotoDisplay(); }
        photoUploadInput.value = null;
    });

    function resetPhotoDisplay() {
        photoLabel.style.backgroundImage = '';
        const icon = photoLabel.querySelector('svg');
        const text = photoLabel.querySelector('span');
        if (icon) icon.style.display = 'block';
        if (text) text.style.display = 'block';
        photoLabel.style.backgroundSize = 'auto';
        currentPhotoDataUrl = null;
    }

    // --- Lógica de Seleção de Cor da Faixa ---
    beltColorSelector.addEventListener('click', function(event) {
        if (event.target.classList.contains('belt-color-square')) {
            const selectedSquare = event.target;
            selectedBeltColor = selectedSquare.dataset.color;
            beltColorSelector.querySelectorAll('.belt-color-square.selected').forEach(sq => sq.classList.remove('selected'));
            selectedSquare.classList.add('selected');
            updateStudentBeltInput();
        }
    });

    // --- Lógica de Seleção de Grau ---
    beltDegreeSelector.addEventListener('click', function(event) {
        if (event.target.classList.contains('belt-degree-square')) {
            const selectedSquare = event.target;
            const degreeValue = selectedSquare.dataset.degree;
            if (selectedSquare.classList.contains('clear-degree')) {
                selectedBeltDegree = '';
                beltDegreeSelector.querySelectorAll('.belt-degree-square.selected').forEach(sq => sq.classList.remove('selected'));
            } else {
                selectedBeltDegree = degreeValue;
                beltDegreeSelector.querySelectorAll('.belt-degree-square.selected').forEach(sq => sq.classList.remove('selected'));
                selectedSquare.classList.add('selected');
            }
            updateStudentBeltInput();
        }
    });

    // --- Função para Atualizar o Input de Faixa/Grau ---
    function updateStudentBeltInput() {
        let beltString = '';
        if (selectedBeltColor) {
            beltString = `Faixa ${selectedBeltColor}`;
        }
        if (selectedBeltDegree) {
            beltString += (beltString ? ` ${selectedBeltDegree}` : `${selectedBeltDegree}`);
        }
        studentBeltInput.value = beltString;
        studentBeltInput.placeholder = beltString ? '' : 'Selecione cor e/ou grau';
    }

    // --- Lógica do Botão "Finalizar Treino" ---
    finishTrainingButton.addEventListener('click', function() {
        const studentName = studentNameInput.value.trim();
        const studentBelt = studentBeltInput.value.trim();
        const trainingDate = trainingDateInput.value;
        const classTime = classTimeSelect.value;
        const photoData = currentPhotoDataUrl;

        if (!studentName || !studentBelt || !trainingDate || !classTime) {
            alert('Por favor, preencha todos os campos obrigatórios.'); return;
        }
        const trainingData = { name: studentName, belt: studentBelt, date: trainingDate, time: classTime, photo: photoData };

        try {
            const key = 'training_' + Date.now();
            localStorage.setItem(key, JSON.stringify(trainingData));
            generateMonthlyReport(); // Atualiza o relatório
            clearForm(); // Limpa o formulário
        } catch (e) {
             if (e.name === 'QuotaExceededError') { alert('Erro: Espaço de armazenamento cheio.'); }
             else { alert('Erro inesperado ao salvar.'); }
             console.error("Erro localStorage:", e);
        }
    });

    // --- Função para Limpar o Formulário ---
    function clearForm() {
        studentNameInput.value = '';
        studentBeltInput.value = '';
        trainingDateInput.value = '';
        classTimeSelect.selectedIndex = 0;
        resetPhotoDisplay();
        selectedBeltColor = '';
        selectedBeltDegree = '';
        beltColorSelector.querySelectorAll('.belt-color-square.selected').forEach(sq => sq.classList.remove('selected'));
        beltDegreeSelector.querySelectorAll('.belt-degree-square.selected').forEach(sq => sq.classList.remove('selected'));
        updateStudentBeltInput();
    }

    // --- Função para Gerar o Relatório Mensal ---
    function generateMonthlyReport() {
         // Limpa o conteúdo anterior do div do relatório
         while (monthlyReportDiv.firstChild) {
            monthlyReportDiv.removeChild(monthlyReportDiv.firstChild);
         }

        const reportList = document.createElement('ul');
        let trainingCount = 0;
        const now = new Date(); const currentMonth = now.getMonth(); const currentYear = now.getFullYear();
        const keysToRemoveOnError = [];
        const reportItems = [];

        // Coleta e valida itens do localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('training_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    let itemDate;
                    const timestamp = parseInt(key.substring('training_'.length));
                    if (!isNaN(timestamp)) { itemDate = new Date(timestamp); }
                    else if (data.date) { itemDate = new Date(data.date + 'T00:00:00'); }

                    if (itemDate && !isNaN(itemDate.getTime())) {
                        reportItems.push({ key: key, data: data, date: itemDate });
                    } else { console.warn(`Item com chave ${key} tem data inválida.`); keysToRemoveOnError.push(key); }
                } catch (e) { console.error(`Erro ao processar chave ${key}:`, e); keysToRemoveOnError.push(key); }
            }
        }
        reportItems.sort((a, b) => b.date - a.date); // Ordena mais recente primeiro

        // Cria HTML dos itens do mês atual
        reportItems.forEach(item => {
            const { key, data, date: itemDate } = item;
            if (itemDate.getFullYear() === currentYear && itemDate.getMonth() === currentMonth) {
                const listItem = document.createElement('li');
                const deleteButton = document.createElement('button');
                deleteButton.type = 'button'; deleteButton.className = 'delete-record-button';
                deleteButton.title = 'Apagar este registro'; deleteButton.setAttribute('aria-label', 'Apagar este registro');
                deleteButton.dataset.key = key;
                deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clip-rule="evenodd" /></svg>`;

                const contentDiv = document.createElement('div');
                contentDiv.className = 'report-item-content';
                let photoElement = '';
                if (data.photo) { photoElement = `<img src="${data.photo}" alt="Foto ${data.name || ''}" class="report-photo">`; }
                else { photoElement = `<span class="no-photo-placeholder">Sem Foto</span>`; }

                const formattedDate = itemDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
                let displayBelt = data.belt || 'N/I';

                const textElement = `<span><strong>${data.name || 'N/I'}</strong><br>${displayBelt} - ${formattedDate} - ${data.time || 'N/I'}</span>`;
                contentDiv.innerHTML = photoElement + textElement;

                listItem.appendChild(contentDiv);
                listItem.appendChild(deleteButton);
                reportList.appendChild(listItem);
                trainingCount++;
            }
        });

        // keysToRemoveOnError.forEach(key => localStorage.removeItem(key));

        // Adiciona lista ou mensagem ao DOM
        if (trainingCount > 0) {
            monthlyReportDiv.appendChild(reportList);
        } else {
            const noTrainingsMessage = document.createElement('p');
            noTrainingsMessage.textContent = 'Nenhum treino registrado neste mês.';
            monthlyReportDiv.appendChild(noTrainingsMessage);
        }
    }

    // --- Lógica de Exclusão Individual ---
    monthlyReportDiv.addEventListener('click', function(event) {
        const deleteButton = event.target.closest('.delete-record-button');
        if (deleteButton) {
            const keyToDelete = deleteButton.dataset.key;
            if (keyToDelete) {
                 let studentName = 'este registro';
                 try { const data = JSON.parse(localStorage.getItem(keyToDelete)); if (data && data.name) studentName = `o registro de ${data.name}`; } catch (e) {}
                if (confirm(`Tem certeza que deseja apagar ${studentName}?`)) {
                    localStorage.removeItem(keyToDelete);
                    generateMonthlyReport(); // Regenera após apagar
                }
            }
        }
    });

    // --- Gera o Relatório Inicial ao Carregar a Página ---
    generateMonthlyReport();

}); // Fim do DOMContentLoaded