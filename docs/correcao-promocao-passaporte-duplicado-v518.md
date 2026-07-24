# v0.5.18 — Correção de promoção com passaporte já cadastrado

A função administrativa de promoção tentava inserir um novo registro em `team_members` quando o cadastro legado possuía o mesmo passaporte associado a outro identificador. Isso violava a restrição única `team_members_passport_key`.

A operação agora:

- procura primeiro o membro pelo ID do perfil;
- quando necessário, reutiliza o registro existente pelo passaporte;
- atualiza cargo, status e payload sem criar duplicidade;
- mantém o vínculo com o perfil no payload;
- reinicia o contrato de Residente em 15 dias na data da promoção;
- preserva os demais dados do payload já existentes.
