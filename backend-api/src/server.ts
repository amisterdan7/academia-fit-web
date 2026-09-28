import express from 'express';
import cors from 'cors';
import { pool } from './db';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/matriculas', async (req, res) => {
  const { nome, data_nascimento, telefone, nome_plano } = req.body;


  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Inicia a transação

    const alunoResult = await client.query(
      `INSERT INTO alunos (nome, data_nascimento, telefone) 
       VALUES ($1, $2, $3) RETURNING id`,
      [nome, data_nascimento, telefone]
    );
    const idAluno = alunoResult.rows[0].id;

    const planoResult = await client.query(
      `SELECT id, duracao_meses FROM planos WHERE nome = $1`,
      [nome_plano]
    );

    if (planoResult.rows.length === 0) {
      throw new Error('Plano escolhido não existe na base de dados.');
    }

    const idPlano = planoResult.rows[0].id;
    const duracaoMeses = planoResult.rows[0].duracao_meses;

    // Calcular as datas de início e fim baseadas na duração do plano
    const dataInicio = new Date();
    const dataFimEstimada = new Date();
    dataFimEstimada.setMonth(dataFimEstimada.getMonth() + duracaoMeses);

    // Inserir a Matrícula cruzando os IDs
    await client.query(
      `INSERT INTO matriculas (id_aluno, id_plano, data_inicio, data_fim_estimada, status) 
       VALUES ($1, $2, $3, $4, 'ativa')`,
      [idAluno, idPlano, dataInicio, dataFimEstimada]
    );

    await client.query('COMMIT'); // Se chegou aqui sem erros, grava tudo de vez
    
    res.status(201).json({ 
      sucesso: true, 
      mensagem: 'Matrícula efetuada com sucesso!',
      alunoId: idAluno 
    });

  } catch (erro) {
    await client.query('ROLLBACK'); // Se der erro, desfaz a inserção do aluno
    console.error('Erro ao registar matrícula:', erro);
    res.status(500).json({ sucesso: false, erro: 'Falha interna ao processar a matrícula.' });
  } finally {
    client.release(); 
  }
});


app.get('/planos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id, 
        p.nome, 
        p.preco, 
        p.duracao_meses, 
        p.descricao, 
        p.destaque,
        COALESCE(
          json_agg(pr.descricao ORDER BY pr.ordem) FILTER (WHERE pr.descricao IS NOT NULL), 
          '[]'
        ) as features
      FROM planos p
      LEFT JOIN plano_recursos pr ON p.id = pr.id_plano
      GROUP BY p.id
      ORDER BY p.preco DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    res.status(500).json({ sucesso: false, erro: 'Falha ao carregar os planos.' });
  }
});

const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
  console.log(`Servidor a correr na porta ${PORT} 🚀`);
});