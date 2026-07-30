# Versão 1.0.119

## Publicação de horários
- Removida a seleção livre de intervalo para acompanhamentos.
- O médico agora seleciona diretamente as datas reais das ocorrências planejadas.
- Cada data informa quantos pacientes possuem acompanhamento vinculado.
- O sistema impede a publicação sem uma data planejada selecionada.
- A gravação é revalidada no Supabase antes da criação das vagas.

## Cadastro infantil
- O vínculo de responsável passou a ser opcional no cadastro do Portal do Paciente.
- Pacientes menores podem concluir o cadastro sem responsável.
- Quando um responsável for informado, a validação e o vínculo continuam funcionando normalmente.
