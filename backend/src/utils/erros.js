/** Erro de domínio com status HTTP e código legível pelo app. */
export class ErroAplicacao extends Error {
  constructor(mensagem, { status = 400, codigo = 'REQUISICAO_INVALIDA', detalhes } = {}) {
    super(mensagem);
    this.name = 'ErroAplicacao';
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

export class ErroValidacao extends ErroAplicacao {
  constructor(mensagem = 'Dados inválidos.', detalhes) {
    super(mensagem, { status: 422, codigo: 'DADOS_INVALIDOS', detalhes });
  }
}

export class ErroNaoAutenticado extends ErroAplicacao {
  constructor(mensagem = 'Faça login para continuar.') {
    super(mensagem, { status: 401, codigo: 'NAO_AUTENTICADO' });
  }
}

export class ErroProibido extends ErroAplicacao {
  constructor(mensagem = 'Você não tem acesso a este recurso.') {
    super(mensagem, { status: 403, codigo: 'ACESSO_NEGADO' });
  }
}

export class ErroNaoEncontrado extends ErroAplicacao {
  constructor(mensagem = 'Recurso não encontrado.') {
    super(mensagem, { status: 404, codigo: 'NAO_ENCONTRADO' });
  }
}

export class ErroConflito extends ErroAplicacao {
  constructor(mensagem, codigo = 'CONFLITO') {
    super(mensagem, { status: 409, codigo });
  }
}
