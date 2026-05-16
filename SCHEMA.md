# ESQUEMA REAL DO BANCO DE DADOS (FIRESTORE)

Este é o mapeamento exato das coleções e documentos reais contidos no Firestore do Projeto Argos. Ao construir a API, SEMPRE dê prioridade a esta estrutura de dados em relação aos exemplos do arquivo DOC_API.md.

## Coleção: `users`

- **Chave primária (ID do Documento):** e-mail do usuário (ex: matheus.cavenaghi@alunos.fho.edu.br)
- **Campos:**
  - `authUid` (string): UID gerado pelo Firebase Auth
  - `nome` / `displayName` (string): Nome do usuário
  - `email` (string): E-mail do usuário
  - `cpf` / `documento` (string): CPF
  - `telefone` (string): Telefone
  - `cidade` (string) e `uf` (string): Localização
  - `credenciadoId` (string): ID da oficina vinculada
  - `credenciadoNome` / `empresa` (string): Nome da oficina
  - `departamento` (string)
  - `foto` / `photoURL` (string): URL da imagem do Google
  - `status` (string): Ex: "ativo"
  - `tipoAcesso` (string): Ex: "email_senha_sso_google"
  - Arrays: `authProviderIds`, `origens`, `providers`
  - Timestamps: `criadoEm`, `atualizadoEm`, `ultimoAcesso`, `ultimoLoginEm`, `cadastroFinalizadoEm`
  - Booleans: `cadastroCompleto`, `primeiroAcessoConcluido`

## Coleção: `credenciados`

- **Campos:**
  - `id` (number)
  - `name` (string): Nome da oficina
  - `email` (string), `phone` (string)
  - `address` (string), `city` (string), `uf` (string)
  - `specialty` (string): Ex: "Mecânica geral"
  - `status` (string): Ex: "Ativo"
  - `score` (string), `slaAvg` (string)
  - `activeClaims` (number/null)
  - `funcionariosUids` (array de strings): Lista de UIDs dos mecânicos daquela oficina
  - Timestamps: `atualizadoEm`

## Coleção: `clientes`

- **Campos:**
  - `id` (number)
  - `nomeCompleto` (string)
  - `cpfCnpj` (string)
  - `email` (string), `telefone` (string)
  - `riscoHistorico` (string): Ex: "Alto", "Baixo"
  - `status` (string): Ex: "Ativo"
  - `tipoPessoa` (string): Ex: "PJ", "PF"
  - `endereco` (map/object): Contém `logradouro`, `numero`, `bairro`, `cidade`, `uf`, `cep`
  - Timestamps: `criadoEm`, `atualizadoEm`

## Coleção: `veiculos`

- **Campos:**
  - `id` (number), `clienteId` (string), `proprietario` (string)
  - `marca` (string), `modelo` (string)
  - `placa` (string), `chassi` (string), `renavam` (string)
  - `anoFabricacao` (number)
  - `cor` (string), `combustivel` (string)
  - `tipoCobertura` (string): Ex: "Terceiros"
  - `status` (string): Ex: "Ativo"

## Coleção: `sinistro`

_NOTA: Usa padrão NoSQL de Snapshots (desnormalização) para evitar joins na leitura._

- **Campos Principais:**
  - `id` (number/string), `protocol` (string): Ex: "ARG-2026-0001"
  - `status` (string): Ex: "Pendente", "Aberto"
  - `statusVistoria` (string): Ex: "Aguardando check-in"
  - `priority` (string): Ex: "Baixa"
  - `claimType` (string): Ex: "Danos em roda e pneu"
  - `damageDescription` (string), `observations` (string)
  - `daysInStage` (string/number)
  - `chatEnabled` (boolean), `chatStatus` (string)
  - Timestamps: `entryDate`, `scheduledDate`, `statusUpdatedAt`, `checkInAt`
- **Snapshots (Objetos embutidos):**
  - `clienteId` (string) + `clientesSnapshot` (map: cpfCnpj, email, nomeCompleto, telefone)
  - `veiculoId` (string) + `veiculoSnapshot` (map: anoFabricacao, chassi, combustivel, cor, marca, modelo, placa, renavam)
  - `credenciadoId` (string) + `credenciadoSnapshot` (map: address, city, email, name, phone, uf)
  - `seguradoraId` (string) + `seguradoraSnapshot` (map: cnpj, name)

## Coleção: `vistorias`

- **Campos Principais:**
  - `idvistoria` (string): Ex: "VIS-2026-0001"
  - `sinistroId` (string): Ex: "ARG-2026-0058"
  - `status` (string): Ex: "abandonada", "realizada"
  - `cliente` (string), `veiculo` (string), `placa` (string)
  - `credenciado` (string), `local` (string)
  - `data` (string), `hora` (string)
  - `inspectorEmail` (string), `inspectorId` (string)
  - `laudo` (string), `pdfLaudoUrl` (string)
  - `observacoes` (string), `descricaoArtigos` (string)
  - `transcriptionStatus` (string), `ultimaTranscricaoOriginal` (string), `ultimaTranscricaoRevisada` (string)
  - Timestamps: `createdAt`, `updatedAt`, `abandonedAt`, `checkInAt`
- **Arrays de Mídia:**
  - `audios` (array de objetos): Contém `contentType`, `createdAt`, `fileName`, `sizeBytes`, `vistoria_1` (base64)
  - `images` (array de objetos): Contém `contentType`, `createdAt`, `fileName`, `sizeBytes`, `vistoria_1` (base64)
  - `chatmessages` (array de objetos): Contém `createdAt`, `role`, `text`, etc.

## Outras Coleções:

- `alertas`: Campos como `categoria`, `dataHora`, `descricao`, `id`, `lido`, `sinistroId`, `tipo`, `titulo`.
- `seguradoras`: Dados básicos (cnpj, name, phone, email).
- `counters`: Documento `vistorias_2026` com `lastNumber` para controle de ID.
