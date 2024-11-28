const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Configurações do Firebase
const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Rota para verificar umidade e temperatura em um dia específico
app.post('/verificar', async (req, res) => {
    let { dataHora } = req.body;

    console.log("Data recebida:", dataHora);

    // Usando a data recebida diretamente (sem hora)
    const startDate = new Date(dataHora);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);  // Definir o final do intervalo para o próximo dia

    // Convertendo as datas para o formato ISO sem a hora
    const startDateISO = startDate.toISOString().split('T')[0];  // Apenas a data
    const endDateISO = endDate.toISOString().split('T')[0]; // Apenas a data

    console.log("Data para consulta (início):", startDateISO);
    console.log("Data para consulta (fim):", endDateISO);

    try {
        const snapshot = await db.collection('SensorData')
            .where('date', '>=', startDateISO)  // Usando o campo 'date'
            .where('date', '<', endDateISO)     // Consultar até o final do dia
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Dados não encontrados para a data selecionada.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            data.push({
                dataHora: `${docData.date} ${docData.time}`,  // Formatação da data e hora
                temperatura: docData.temp,
                umidade: docData.hmd
            });
        });

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Rota para exibir todos os dados
app.get('/exibirTodos', async (req, res) => {
    try {
        const snapshot = await db.collection('SensorData').get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Nenhum dado encontrado.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            data.push({
                dataHora: `${docData.date} ${docData.time}`,
                temperatura: docData.temp,
                umidade: docData.hmd
            });
        });

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar todos os dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
