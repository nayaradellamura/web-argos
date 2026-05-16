JSON BASE

{
  "AuthUser": {
    "id": "USR-001",
    "nome": "Nayara Dellamura",
    "email": "nayara.dellamura@argos.com",
    "cargo": "Analista Sênior",
    "departamento": "Regulação",
    "nivelAcesso": "admin",
    "status": "ativo"
  },
  "AuthTokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 3600
  },
  "Sinistro": {
    "id": "CLM-1024",
    "vehicle": "Honda Civic",
    "plate": "ABC-1234",
    "workshop": "Oficina Central SP",
    "entryDate": "2026-04-11",
    "priority": "within-sla",
    "daysInStage": 2,
    "status": "fnol",
    "credenciado": "Elite Motors",
    "statusVistoria": "agendada"
  },
  "Vistoria": {
    "id": "VST-001",
    "sinistroId": "CLM-127",
    "credenciado": "Auto Center Premium",
    "local": "Av. Paulista, 1000 - São Paulo, SP",
    "data": "2026-04-15",
    "hora": "14:30",
    "status": "agendada",
    "veiculo": "Honda Civic",
    "placa": "ABC-1234",
    "cliente": "João Silva",
    "laudo": "texto do laudo",
    "pdfLaudoUrl": "https://arquivo.pdf",
    "audios": [
      {
        "id": "AUD-001",
        "nome": "Áudio do vistoriador",
        "url": "https://audio.mp3",
        "transcricao": "texto"
      }
    ],
    "imagens": [
      {
        "id": "IMG-001",
        "nome": "Lateral esquerda",
        "url": "https://imagem.jpg"
      }
    ],
    "descricaoArtigos": "Dano na lateral esquerda",
    "observacoes": "Vistoria realizada com sucesso."
  },
  "Cliente": {
    "id": "CLI-001",
    "nomeCompleto": "João Silva Santos",
    "cpfCnpj": "123.456.789-00",
    "telefone": "(11) 99999-9999",
    "email": "joao@email.com",
    "riscoHistorico": "baixo",
    "status": "ativo"
  },
  "Veiculo": {
    "id": "VEI-001",
    "placa": "ABC-1234",
    "modelo": "Honda Civic 2.0",
    "anoFabricacao": 2022,
    "proprietario": "João Silva Santos",
    "tipoCobertura": "completa",
    "status": "ativo"
  },
  "UsuarioInterno": {
    "id": "USR-001",
    "nome": "Nayara Dellamura",
    "email": "nayara.dellamura@argos.com",
    "cargo": "Analista Sênior",
    "departamento": "Regulação",
    "nivelAcesso": "gestor",
    "status": "ativo",
    "ultimoAcesso": "Agora"
  },
  "Credenciado": {
    "id": "OFC-001",
    "name": "Elite Motors",
    "city": "Araras-SP",
    "specialty": "Chapeação Avançada",
    "score": 4.9,
    "slaAvg": "2.8 dias",
    "activeClaims": 12,
    "phone": "(19) 3541-2200",
    "email": "contato@elitemotors.com.br",
    "status": "ativo"
  },
  "CredenciadoHistoricoItem": {
    "sinistroId": "SIN-2481",
    "status": "Concluído",
    "updatedAt": "2026-04-20T10:00:00Z",
    "slaInfo": "SLA 2.9 dias"
  },
  "Alerta": {
    "id": "ALT-001",
    "tipo": "critico",
    "titulo": "Sinistro #CLM-1024...",
    "descricao": "texto",
    "sinistroId": "CLM-1024",
    "dataHora": "há 5 min",
    "categoria": "Possível Fraude",
    "lido": false
  }
}

ENDPOINTS POR TELA/MÓDULO  

LOGIN / AUTENTICAÇÃO

1. POST /api/auth/login
   Ação: autêntica usuário.

Request Body: 
{ "email": "string", "password": "string" }

Response Body: 
{ "user": AuthUser, "tokens": AuthTokens }

2. POST /api/auth/refresh
   Ação: renova token.

Request Body: 
{ "refreshToken": "string" }

Response Body: 
{ "tokens": AuthTokens }

3. POST /api/auth/logout
   Ação: encerra sessão.

Request Body: 
{ "refreshToken": "string" }

Response Body: 
{ "success": true }

4. GET /api/auth/me
   Ação: retorna usuário logado.

Response Body:
{ "user": AuthUser }

DASHBOARD

5. GET /api/dashboard/kpis
   Ação: KPIs dos cards.

Response Body: 
{ "volumeAberturasHoje": 147, 
   "variacaoVolume": "+12% vs. ontem", 
   "tempoMedioRegulacaoHoras": 4.2, 
   "metaSlaHoras": 6, 
   "riscoFraudePercentual": 1.8, 
   "alertasCriticosAbertos": 5 
}

6. GET /api/dashboard/severity-chart?periodo=30d
   Ação: série do gráfico de severidade.

Response Body: 
{
   "data":[
      {
         "dia":"01",
         "leve":45,
         "media":28,
         "grandeMonta":12
      }
   ]
}

7. GET /api/dashboard/alerts-feed?limit=5
   Ação: feed curto do dashboard.

Response Body: 
{
   "data":[
      {
         "id":"1",
         "type":"critical",
         "title":"Sinistro #1024",
         "description":"texto",
         "time":"2 min atras"
      }
   ]
}

8. GET /api/dashboard/recent-claims?limit=5
   Ação: tabela últimos sinistros processados.

Response Body: 
{
   "data":[
      {
         "id":"#1024",
         "placa":"ABC-1234",
         "oficina":"Oficina Central SP",
         "severidade":"Grande Monta",
         "status":"Em Analise",
         "dataHora":"Hoje, 14:32"
      }
   ]
}

SINISTROS 

9. GET /api/sinistros?search=&status=&priority=&page=1&pageSize=20
   Ação: lista sinistros para kanban.

Response Body: 
{
   "data":[
      "Sinistro"
   ],
   "meta":{
      "page":1,
      "pageSize":20,
      "total":120
   }
}

10. GET /api/sinistros/{id}
    Ação: detalhe do sinistro.

Response Body: 
{
   "data":"Sinistro"
}

11. POST /api/sinistros
    Ação: cria sinistro (cartão FNOL).

Request Body: 
{
   "vehicle":"string",
   "plate":"string",
   "workshop":"string",
   "entryDate":"YYYY-MM-DD",
   "priority":"within-sla",
   "daysInStage":0
}

Response Body:
{
   "data":"Sinistro"
}

12. PUT /api/sinistros/{id}
    Ação: edita dados do sinistro.

Request Body: 
{
   "vehicle":"string",
   "plate":"string",
   "workshop":"string",
   "entryDate":"YYYY-MM-DD",
   "priority":"attention",
   "daysInStage":3,
   "credenciado":"string",
   "statusVistoria":"agendada"
}

Response Body:
{
   "data":"Sinistro"
}

13. PATCH /api/sinistros/{id}/stage
    Ação: move no pipeline (drag-and-drop).

Request Body: 
{
   "status":"validacao"
}

Response Body: 
{
   "data":"Sinistro"
}

14. DELETE /api/sinistros/{id}
    Ação: remove sinistro.

Response Body: 
{ 
   "success": true 
}

15. PATCH /api/sinistros/{id}/vistoria
    Ação: vincula/atualiza vistoria no sinistro.

Request Body: 
{
   "credenciado":"string",
   "statusVistoria":"pendente"
}

Response Body: 
{
   "data":"Sinistro"
}

16. GET /api/sinistros/{id}/timeline
    Ação: histórico para detalhe operacional.

Response Body: 
{
   "data":[
      {
         "id":"EVT-1",
         "tipo":"movimentacao",
         "descricao":"Movido para vistoria",
         "dataHora":"2026-04-21T10:00:00Z"
      }
   ]
}

VISTORIAS 17. GET /api/vistorias?search=&status=&page=1&pageSize=20
Ação: lista vistorias com filtro.

Response Body: 
{
   "data":[
      "Vistoria"
   ],
   "meta":{
      "page":1,
      "pageSize":20,
      "total":40
   }
}

18. GET /api/vistorias/{id}
    Ação: detalhe completo da vistoria (laudo, PDF, áudio, imagens).

Response Body: 
{
   "data":"Vistoria"
}

19. POST /api/vistorias
    Ação: cria/vincula nova vistoria.

Request Body: 
{
   "sinistroId":"CLM-127",
   "credenciado":"Elite Motors",
   "status":"agendada"
}

Response Body: 
{
   "data":"Vistoria"
}

20. PUT /api/vistorias/{id}
    Ação: atualiza status, agenda, local e conteúdo técnico.

Request Body: 
{
   "local":"string",
   "data":"YYYY-MM-DD",
   "hora":"HH:mm",
   "status":"realizada",
   "laudo":"string",
   "pdfLaudoUrl":"https://...",
   "descricaoArtigos":"string",
   "observacoes":"string"
}

Response Body: 
{
   "data":"Vistoria"
}

21. DELETE /api/vistorias/{id}
    Ação: remove vistoria vinculada.

Response Body: 
{ "success": true }

22. GET /api/vistorias/opcoes-vinculo
    Ação: traz opções para modal “Vincular Vistoria”.

Response Body:

{
   "sinistrosDisponiveis":[
      {
         "id":"CLM-127",
         "veiculo":"Honda Civic",
         "placa":"ABC-1234",
         "cliente":"João Silva"
      }
   ],
   "credenciadosDisponiveis":[
      "Elite Motors",
      "AutoPrime Reparos"
   ]
}

CADASTROS - CLIENTES

23. GET /api/clientes?search=&page=1&pageSize=5&status=&riscoHistorico=
    Ação: lista clientes.

Response Body: 
{
   "data":[
      "Cliente"
   ],
   "meta":{
      "page":1,
      "pageSize":5,
      "total":10
   }
}

24. GET /api/clientes/{id}
    Ação: detalhe de cliente.

Response Body: 
{
   "data":"Cliente"
}

25. POST /api/clientes
    Ação: cria cliente.

Request Body: 
{
   "nomeCompleto":"string",
   "cpfCnpj":"string",
   "telefone":"string",
   "email":"string",
   "riscoHistorico":"baixo",
   "status":"ativo"
}

Response Body: 
{
   "data":"Cliente"
}

26. PUT /api/clientes/{id}
    Ação: edita cliente.

Request Body: igual ao POST.
Response Body:
{
   "data":"Cliente"
}

27. DELETE /api/clientes/{id}
    Ação: exclui cliente.

Response Body: 
{
   "success":"true"
}

CADASTROS - VEÍCULOS

28. GET /api/veiculos?search=&page=1&pageSize=5&status=&tipoCobertura=
    Ação: lista veículos.

Response Body: 
{
   "data":[
      "Veiculo"
   ],
   "meta":{
      "page":1,
      "pageSize":5,
      "total":10
   }
}

29. GET /api/veiculos/{id}
    Ação: detalhe de veículo.

Response Body: 
{
   "data":"Veiculo"
}

30. POST /api/veiculos
    Ação: cria veículo.

Request Body: 
{
   "placa":"string",
   "modelo":"string",
   "anoFabricacao":2024,
   "proprietario":"string",
   "tipoCobertura":"basica",
   "status":"ativo"
}

Response Body:
{
   "data":"Veiculo"
}

31. PUT /api/veiculos/{id}
    Ação: edita veículo.

Request Body: igual ao POST.
Response Body: 
{
   "data":"Veiculo"
}

32. DELETE /api/veiculos/{id}
    Ação: exclui veículo.

Response Body: 
{
   "success":true
}

CADASTROS - USUÁRIOS INTERNOS

33. GET /api/usuarios?search=&page=1&pageSize=5&status=&nivelAcesso=&departamento=
    Ação: lista usuários internos.

Response Body:
{
   "data":[
      "UsuarioInterno"
   ],
   "meta":{
      "page":1,
      "pageSize":5,
      "total":10
   }
}

34. GET /api/usuarios/{id}
    Ação: detalhe de usuário interno.

Response Body: 
{ "data": UsuarioInterno }

35. POST /api/usuarios
    Ação: cria usuário interno.

Request Body: 
{
   "nome":"string",
   "email":"string",
   "cargo":"string",
   "departamento":"string",
   "nivelAcesso":"analista",
   "status":"ativo"
}

Response Body: 
{
   "data":"UsuarioInterno"
}

36. PUT /api/usuarios/{id}
    Ação: edita usuário interno.

Request Body: igual ao POST.
Response Body: 
{
   "data":"UsuarioInterno"
}

37. DELETE /api/usuarios/{id}
    Ação: exclui usuário interno.

Response Body: 
{
   "success":true
}

OFICINAS CREDENCIADAS

38. GET /api/credenciados?search=&city=&specialty=&status=&page=1&pageSize=12
    Ação: lista oficinas com filtros.

Response Body: 
{
   "data":[
      "Credenciado"
   ],
   "meta":{
      "page":1,
      "pageSize":12,
      "total":47
   }
}

39. GET /api/credenciados/{id}
    Ação: detalhe da oficina.

Response Body: 
{
   "data":"Credenciado"
}

40. POST /api/credenciados
    Ação: cria credenciado.

Request Body: 
{
   "name":"string",
   "city":"Araras-SP",
   "specialty":"Mecanica Geral",
   "phone":"string",
   "email":"string",
   "score":4.0,
   "slaAvg":"3.0 dias",
   "status":"ativo"
}

Response Body: 
{
   "data":"Credenciado"
}

41. PUT /api/credenciados/{id}
    Ação: edita credenciado.

Request Body: igual ao POST.
Response Body: 
{
   "data":"Credenciado"
}

42. PATCH /api/credenciados/{id}/status
    Ação: suspender/reativar.

Request Body: 
{
   "status":"suspenso"
}

Response Body: 
{
   "data":"Credenciado"
}

43. DELETE /api/credenciados/{id}
    Ação: exclui credenciado.

Response Body: 
{
   "success":true
}

44. GET /api/credenciados/{id}/historico-sinistros
    Ação: histórico no modal “Histórico de Sinistro”.

Response Body: 
{
   "data":[
      "CredenciadoHistoricoItem"
   ]
}

45. GET /api/credenciados/filtros
    Ação: opções dinâmicas de cidade/especialidade.

Response Body:
{
   "cities":[
      "Todas",
      "Araras-SP"
   ],
   "specialties":[
      "Todas",
      "Mecanica Geral"
   ]
}

ALERTAS

46. GET /api/alertas?tipo=critico|sla|sistema|lido&lido=true|false&page=1&pageSize=20
    Ação: lista alertas com filtros por aba.

Response Body: 
{
   "data":[
      "Alerta"
   ],
   "meta":{
      "page":1,
      "pageSize":20,
      "total":12
   }
}

47. GET /api/alertas/counts
    Ação: contadores das abas (crítico, sla, sistema, lidos).

Response Body: 
{
   "critico":2,
   "sla":3,
   "sistema":3,
   "lidos":4
}

48. PATCH /api/alertas/{id}/marcar-lido
    Ação: marca um alerta como lido.

Request Body: 
{
   "lido":true
}

Response Body: 
{
   "data":"Alerta"
}

49. PATCH /api/alertas/marcar-lidos
    Ação: marca lote como lido (opcional, mas recomendado).

Request Body: 
{
   "ids":[
      "ALT-001",
      "ALT-002"
   ]
}

Response Body: 
{
   "updated":2
}

GET /api/perfil e PUT /api/perfil 

Tela Meu Perfil em PerfilSettings

GET /api/configuracoes/notificacoes e PUT /api/configuracoes/notificacoes

Tela NotificacoesSetting).

---

faz sentido
