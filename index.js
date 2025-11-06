
    lucide.createIcons();

    // === VERIFICAÇÃO DE LOGIN ===
    const perfilSalvo = JSON.parse(localStorage.getItem('perfil'));
    if (!perfilSalvo || !perfilSalvo.drt) {
      window.location.href = 'login.html';
      throw new Error('Acesso negado');
    }

    let perfil = perfilSalvo;
    let entregas = JSON.parse(localStorage.getItem('entregas')) || [];
    let dadosForm = {
      data_toi: '', uc: '', nome_recebedor: '',
      endereco: '', cep: '', cidade: '', uf: '', pais: 'Brasil',
      tentativa1: '', tentativa2: '', tentativa3: '',
      data_entrega: '', obs: '', status: 'pendente',
      drt_entregador: '', ass_recebedor: '', fotos: []
    };
    let passoAtual = 1;
    let idEditando = null;
    let stream = null;

    const statusCfg = {
      pendente: { texto: 'Pendente', cor: 'bg-gray-100 text-gray-800 border-gray-200' },
      em_andamento: { texto: 'Em Andamento', cor: 'bg-orange-100 text-orange-800 border-orange-200' },
      entregue: { texto: 'Entregue', cor: 'bg-green-100 text-green-800 border-green-200' },
      cancelada: { texto: 'Recusado', cor: 'bg-red-100 text-red-800 border-red-200' }
    };

    // === LOGOUT ===
    document.querySelectorAll('#logout, #logout-mobile, #logout-menu').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('perfil');
        window.location.href = 'login.html';
      });
    });

    function irPara(pagina) {
      document.querySelectorAll('.pagina').forEach(p => p.classList.add('hidden'));
      document.querySelector(`#${pagina}`).classList.remove('hidden');
      document.querySelectorAll('.link-nav').forEach(a => {
        const ativo = a.getAttribute('href') === `#${pagina}`;
        a.classList.toggle('bg-indigo-500', ativo);
        a.classList.toggle('text-white', ativo);
      });
      if (pagina === 'inicio') atualizarEstatisticas();
      if (pagina === 'nova-entrega') {
        document.getElementById('titulo-form').textContent = idEditando ? 'Editar Recibo' : 'Recibo de Entrega';
        document.getElementById('desc-form').textContent = idEditando ? 'Edite os dados do recibo' : 'Preencha os dados do recibo';
        renderizarPasso();
      }
      if (pagina === 'minhas-entregas') renderizarLista();
      window.scrollTo(0, 0);
    }

    document.getElementById('btn-menu-mobile').addEventListener('click', () => document.getElementById('menu-mobile').classList.remove('hidden'));
    document.getElementById('btn-fechar-mobile').addEventListener('click', () => document.getElementById('menu-mobile').classList.add('hidden'));

    document.querySelectorAll('.link-nav').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pagina = link.getAttribute('href').slice(1);
        if (pagina === 'nova-entrega') {
          idEditando = null;
          dadosForm = { data_toi: '', uc: '', nome_recebedor: '', endereco: '', cep: '', cidade: '', uf: '', pais: 'Brasil', tentativa1: '', tentativa2: '', tentativa3: '', data_entrega: '', obs: '', status: 'pendente', drt_entregador: '', ass_recebedor: '', fotos: [] };
          passoAtual = 1;
        }
        irPara(pagina);
        document.getElementById('menu-mobile').classList.add('hidden');
      });
    });

    function atualizarEstatisticas() {
      const stats = {
        total: entregas.length,
        recebidos: entregas.filter(e => e.status === 'entregue').length,
        pendentes: entregas.filter(e => e.status === 'pendente').length,
        andamento: entregas.filter(e => e.status === 'em_andamento').length
      };

      document.getElementById('cards-estatisticas').innerHTML = `
        <div class="bg-white shadow-lg hover:shadow-xl rounded-xl p-6 fade-in">
          <div class="flex justify-between items-start">
            <div><p class="text-sm text-gray-500 mb-1">Total</p><h3 class="text-4xl font-bold">${stats.total}</h3></div>
            <div class="p-3 bg-indigo-100 rounded-xl"><i data-lucide="file-text" class="w-6 h-6 text-indigo-600"></i></div>
          </div>
        </div>
        <div class="bg-white shadow-lg hover:shadow-xl rounded-xl p-6 fade-in">
          <div class="flex justify-between items-start">
            <div><p class="text-sm text-gray-500 mb-1">Entregues</p><h3 class="text-4xl font-bold">${stats.recebidos}</h3></div>
            <div class="p-3 bg-green-100 rounded-xl"><i data-lucide="check-circle" class="w-6 h-6 text-green-600"></i></div>
          </div>
        </div>
        <div class="bg-white shadow-lg hover:shadow-xl rounded-xl p-6 fade-in">
          <div class="flex justify-between items-start">
            <div><p class="text-sm text-gray-500 mb-1">Em Andamento</p><h3 class="text-4xl font-bold">${stats.andamento}</h3></div>
            <div class="p-3 bg-orange-100 rounded-xl"><i data-lucide="clock" class="w-6 h-6 text-orange-600"></i></div>
          </div>
        </div>
        <div class="bg-white shadow-lg hover:shadow-xl rounded-xl p-6 fade-in">
          <div class="flex justify-between items-start">
            <div><p class="text-sm text-gray-500 mb-1">Pendentes</p><h3 class="text-4xl font-bold">${stats.pendentes}</h3></div>
            <div class="p-3 bg-gray-100 rounded-xl"><i data-lucide="x-circle" class="w-6 h-6 text-gray-600"></i></div>
          </div>
        </div>
      `;

      const mobileStats = document.getElementById('cards-estatisticas-mobile');
      if (mobileStats) {
        mobileStats.innerHTML = `
          <div class="bg-indigo-50 rounded-lg p-3 text-center">
            <p class="text-indigo-600 text-xs font-medium">Total</p>
            <p class="font-bold text-xl">${stats.total}</p>
          </div>
          <div class="bg-green-50 rounded-lg p-3 text-center">
            <p class="text-green-600 text-xs font-medium">Entregues</p>
            <p class="font-bold text-xl">${stats.recebidos}</p>
          </div>
          <div class="bg-orange-50 rounded-lg p-3 text-center">
            <p class="text-orange-600 text-xs font-medium">Andamento</p>
            <p class="font-bold text-xl">${stats.andamento}</p>
          </div>
          <div class="bg-gray-50 rounded-lg p-3 text-center">
            <p class="text-gray-600 text-xs font-medium">Pendentes</p>
            <p class="font-bold text-xl">${stats.pendentes}</p>
          </div>
        `;
      }

      lucide.createIcons();
    }

    const passos = [
      { num: 1, titulo: 'Recebedor' },
      { num: 2, titulo: 'Endereço' },
      { num: 3, titulo: 'Tentativas' },
      { num: 4, titulo: 'Recebimento' },
      { num: 5, titulo: 'Finalização' }
    ];

    function renderizarPasso() {
      const barra = document.getElementById('passos');
      barra.innerHTML = passos.map((p, i) => `
        <div class="flex flex-col items-center">
          <div class="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold transition-all ${passoAtual >= p.num ? 'grad-azul text-white shadow-lg' : 'bg-gray-200 text-gray-500'}">
            ${p.num}
          </div>
          <p class="text-xs mt-2 font-medium text-center hidden md:block ${passoAtual >= p.num ? 'text-indigo-600' : 'text-gray-500'}">${p.titulo}</p>
        </div>
        ${i < passos.length - 1 ? `<div class="flex-1 h-1 mx-1 bg-gray-200 rounded"><div class="h-full rounded transition-all ${passoAtual > p.num ? 'grad-azul' : ''}" style="width: ${passoAtual > p.num ? '100%' : '0%'}"></div></div>` : ''}
      `).join('');

      const area = document.getElementById('form-conteudo');
      area.innerHTML = '';

      // === PASSO 1: Recebedor ===
      if (passoAtual === 1) {
        area.innerHTML = `
          <div class="bg-white shadow-2xl rounded-xl fade-in p-4 md:p-6">
            <div class="border-b border-gray-100 pb-4 mb-6">
              <h3 class="text-xl font-bold flex items-center gap-2">
                <i data-lucide="user-check" class="w-6 h-6 text-indigo-600"></i> 
                Dados do Recebedor
              </h3>
            </div>

            <form id="form-recebedor" class="space-y-5">
              <div class="relative">
                <i data-lucide="calendar" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                <input id="data_toi" type="date" value="${dadosForm.data_toi || ''}" required class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">Data TOI *</label>
              </div>

              <div class="relative">
                <i data-lucide="hash" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                <input id="uc" type="text" value="${dadosForm.uc || ''}" placeholder="UC (Unidade Consumidora) *" required class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">UC *</label>
              </div>

              <div class="relative">
                <i data-lucide="edit-3" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                <input id="nome_recebedor" type="text" value="${dadosForm.nome_recebedor || ''}" placeholder="Nome completo do recebedor *" required class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" />
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">Nome Completo *</label>
              </div>

              <button type="submit" class="w-full grad-azul text-white h-12 rounded-xl shadow-lg flex items-center justify-center font-semibold text-base mt-6">
                Próximo 
                <i data-lucide="chevron-right" class="w-5 h-5 ml-2"></i>
              </button>
            </form>
          </div>
        `;

        document.getElementById('form-recebedor').onsubmit = e => {
          e.preventDefault();
          const data_toi = document.getElementById('data_toi').value;
          const uc = document.getElementById('uc').value.trim();
          const nome_recebedor = document.getElementById('nome_recebedor').value.trim();

          if (!data_toi || !uc || !nome_recebedor) {
            alert('Preencha todos os campos obrigatórios!');
            return;
          }

          dadosForm.data_toi = data_toi;
          dadosForm.uc = uc;
          dadosForm.nome_recebedor = nome_recebedor;

          passoAtual++;
          renderizarPasso();
        };

        lucide.createIcons();
      }

      // === PASSO 2: Endereço ===
      else if (passoAtual === 2) {
        area.innerHTML = `
          <div class="bg-white shadow-2xl rounded-xl fade-in p-4 md:p-6">
            <div class="border-b border-gray-100 pb-4 mb-4">
              <h3 class="text-xl font-bold flex items-center gap-2">
                <i data-lucide="map-pin" class="w-6 h-6 text-indigo-600"></i> 
                Endereço
              </h3>
            </div>

            <form id="form-endereco" class="space-y-4">
              <div class="relative">
                <i data-lucide="map-pin" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                <input id="cep" type="text" value="${dadosForm.cep || ''}" placeholder="00000-000" maxlength="9" class="w-full h-12 pl-10 pr-4 rounded-xl border ${dadosForm.cep && !dadosForm.endereco ? 'border-red-300' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-500"/>
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">CEP *</label>
                <span id="cep-status" class="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs"></span>
              </div>

              <div class="relative">
                <i data-lucide="home" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                <input id="endereco" type="text" value="${dadosForm.endereco || ''}" placeholder="Rua, número, complemento *" required class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"/>
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">Endereço *</label>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="relative">
                  <i data-lucide="building" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                  <input id="cidade" type="text" value="${dadosForm.cidade || ''}" placeholder="Cidade *" required class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"/>
                  <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">Cidade *</label>
                </div>
                <div class="relative">
                  <i data-lucide="flag" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                  <input id="uf" type="text" value="${dadosForm.uf || ''}" placeholder="UF *" maxlength="2" required class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 uppercase"/>
                  <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">UF *</label>
                </div>
              </div>

              <div class="relative">
                <i data-lucide="globe" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"></i>
                <input id="pais" type="text" value="${dadosForm.pais || 'Brasil'}" placeholder="País" class="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500"/>
                <label class="absolute -top-2 left-3 bg-white px-1 text-xs font-medium text-gray-600">País</label>
              </div>

              <div class="flex gap-2 pt-4">
                <button type="button" onclick="passoAtual--; renderizarPasso();" class="flex-1 h-12 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center">
                  <i data-lucide="chevron-left" class="w-5 h-5 mr-1"></i> Voltar
                </button>
                <button type="submit" class="flex-1 grad-azul text-white h-12 rounded-xl shadow-lg flex items-center justify-center">
                  Próximo <i data-lucide="chevron-right" class="w-5 h-5 ml-2"></i>
                </button>
              </div>
            </form>
          </div>
        `;

        const cepInput = document.getElementById('cep');
        const cepStatus = document.getElementById('cep-status');

        cepInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 5) value = value.slice(0, 5) + '-' + value.slice(5, 8);
          e.target.value = value;

          if (value.length === 9) {
            buscarCEP(value);
          } else {
            cepStatus.innerHTML = '';
            cepInput.classList.remove('border-green-300', 'border-red-300');
          }
        });

        async function buscarCEP(cep) {
          cepStatus.innerHTML = '<i data-lucide="loader" class="w-4 h-4 animate-spin"></i>';
          cepInput.classList.remove('border-green-300', 'border-red-300');

          try {
            const res = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
            const data = await res.json();

            if (data.erro) throw new Error('CEP não encontrado');

            document.getElementById('endereco').value = `${data.logradouro || ''}${data.complemento ? ', ' + data.complemento : ''}`.trim();
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('uf').value = data.uf || '';

            cepStatus.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-green-600"></i>';
            cepInput.classList.add('border-green-300');
            lucide.createIcons();
          } catch (err) {
            cepStatus.innerHTML = '<i data-lucide="x" class="w-4 h-4 text-red-600"></i>';
            cepInput.classList.add('border-red-300');
            lucide.createIcons();
          }
        }

        document.getElementById('form-endereco').onsubmit = e => {
          e.preventDefault();
          const cep = document.getElementById('cep').value;
          const endereco = document.getElementById('endereco').value.trim();
          const cidade = document.getElementById('cidade').value.trim();
          const uf = document.getElementById('uf').value.trim().toUpperCase();

          if (!/^\d{5}-\d{3}$/.test(cep)) {
            alert('CEP inválido! Use o formato 00000-000');
            return;
          }

          if (!endereco || !cidade || !uf) {
            alert('Preencha todos os campos obrigatórios!');
            return;
          }

          dadosForm.cep = cep;
          dadosForm.endereco = endereco;
          dadosForm.cidade = cidade;
          dadosForm.uf = uf;
          dadosForm.pais = document.getElementById('pais').value.trim() || 'Brasil';

          passoAtual++;
          renderizarPasso();
        };

        lucide.createIcons();
      }

      // === PASSO 3: Tentativas ===
      else if (passoAtual === 3) {
        area.innerHTML = `
          <div class="bg-white shadow-2xl rounded-xl fade-in p-4 md:p-6">
            <div class="border-b border-gray-100 pb-4 mb-4"><h3 class="text-xl font-bold flex items-center gap-2"><i data-lucide="calendar" class="w-6 h-6 text-indigo-600"></i> Tentativas</h3></div>
            <form id="form-tentativas" class="space-y-4">
              <input id="tentativa1" type="date" value="${dadosForm.tentativa1}" class="w-full h-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500">
              <input id="tentativa2" type="date" value="${dadosForm.tentativa2}" class="w-full h-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500">
              <input id="tentativa3" type="date" value="${dadosForm.tentativa3}" class="w-full h-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500">
              <div class="flex gap-2">
                <button type="button" onclick="passoAtual--; renderizarPasso();" class="flex-1 h-12 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center"><i data-lucide="chevron-left" class="w-5 h-5 mr-1"></i> Voltar</button>
                <button type="submit" class="flex-1 grad-azul text-white h-12 rounded-xl shadow-lg flex items-center justify-center">Próximo <i data-lucide="chevron-right" class="w-5 h-5 ml-2"></i></button>
              </div>
            </form>
          </div>`;
        document.getElementById('form-tentativas').onsubmit = e => {
          e.preventDefault();
          dadosForm.tentativa1 = document.getElementById('tentativa1').value;
          dadosForm.tentativa2 = document.getElementById('tentativa2').value;
          dadosForm.tentativa3 = document.getElementById('tentativa3').value;
          passoAtual++;
          renderizarPasso();
        };
      }

      // === PASSO 4: Recebimento ===
      else if (passoAtual === 4) {
        area.innerHTML = `
          <div class="bg-white shadow-2xl rounded-xl fade-in p-4 md:p-6">
            <div class="border-b border-gray-100 pb-4 mb-4"><h3 class="text-xl font-bold flex items-center gap-2"><i data-lucide="file-text" class="w-6 h-6 text-indigo-600"></i> Recebimento</h3></div>
            <form id="form-entrega" class="space-y-4">
              <input id="data_entrega" type="date" value="${dadosForm.data_entrega}" class="w-full h-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500">
              
              <select id="obs" class="w-full h-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="" ${!dadosForm.obs ? 'selected' : ''}>Selecione uma opção (opcional)</option>
                <option value="Cartas de recuperação de consumo" ${dadosForm.obs === 'Cartas de recuperação de consumo' ? 'selected' : ''}>Cartas de recuperação de consumo</option>
                <option value="Faturas de recuperação de consumo" ${dadosForm.obs === 'Faturas de recuperação de consumo' ? 'selected' : ''}>Faturas de recuperação de consumo</option>
                <option value="Termo de ocorrência de inspeção" ${dadosForm.obs === 'Termo de ocorrência de inspeção' ? 'selected' : ''}>Termo de ocorrência de inspeção</option>
              </select>

              <select id="status" class="w-full h-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500">
                <option value="pendente" ${dadosForm.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                <option value="em_andamento" ${dadosForm.status === 'em_andamento' ? 'selected' : ''}>Em Andamento</option>
                <option value="entregue" ${dadosForm.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                <option value="cancelada" ${dadosForm.status === 'cancelada' ? 'selected' : ''}>Recusado</option>
              </select>

              <div class="flex gap-2">
                <button type="button" onclick="passoAtual--; renderizarPasso();" class="flex-1 h-12 rounded-xl border border-gray-200 hover:bg-gray-100 flex items-center justify-center"><i data-lucide="chevron-left" class="w-5 h-5 mr-1"></i> Voltar</button>
                <button type="submit" class="flex-1 grad-azul text-white h-12 rounded-xl shadow-lg flex items-center justify-center">Próximo <i data-lucide="chevron-right" class="w-5 h-5 ml-2"></i></button>
              </div>
            </form>
          </div>`;
        document.getElementById('form-entrega').onsubmit = e => {
          e.preventDefault();
          dadosForm.data_entrega = document.getElementById('data_entrega').value;
          dadosForm.obs = document.getElementById('obs').value;
          dadosForm.status = document.getElementById('status').value;
          passoAtual++;
          renderizarPasso();
        };
      }

      // === PASSO 5: Finalização (COM BOTÃO SALVAR) ===
      else if (passoAtual === 5) {
        area.innerHTML = `
          <div class="bg-white shadow-2xl rounded-xl fade-in p-4 md:p-6">
            <div class="border-b border-gray-100 pb-4 mb-6">
              <h3 class="text-xl font-bold flex items-center gap-2">
                <i data-lucide="pen-tool" class="w-6 h-6 text-indigo-600"></i> Finalização
              </h3>
            </div>
            <form id="form-assinaturas" class="space-y-6">

              <!-- DRT -->
              <div>
                <label class="font-semibold flex items-center gap-2">
                  <i data-lucide="id-card" class="w-5 h-5 text-indigo-600"></i>
                  DRT do Entregador
                </label>
                <input id="drt-entregador" type="text" value="${dadosForm.drt_entregador || ''}" 
                       placeholder="Ex: 12345678" required 
                       class="mt-2 w-full h-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500" 
                       maxlength="12">
                <p class="text-xs text-gray-500 mt-1">Registro do entregador</p>
              </div>

              <!-- Assinatura -->
              <div>
                <div class="flex justify-between mb-2">
                  <label class="font-semibold">Assinatura do Recebedor</label>
                  <button type="button" onclick="limparCanvas('canvas-recebedor')" 
                          class="text-sm text-red-600 flex items-center hover:bg-red-50 px-2 py-1 rounded">
                    <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i>Limpar
                  </button>
                </div>
                <canvas id="canvas-recebedor" 
                        class="w-full canvas-mobile border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 cursor-crosshair"></canvas>
                <p class="text-xs text-gray-500 mt-1">Assine com o dedo ou mouse</p>
              </div>

              <!-- Fotos -->
              <div class="space-y-3">
                <label class="font-semibold flex items-center gap-2">
                  <i data-lucide="camera" class="w-5 h-5 text-indigo-600"></i>
                  Fotos da Entrega (opcional)
                </label>
                <div class="flex gap-2 mb-3">
                  <button type="button" id="abrir-camera" 
                          class="flex-1 bg-blue-600 text-white h-10 rounded-lg flex items-center justify-center text-sm hover:bg-blue-700 transition">
                    <i data-lucide="camera" class="w-4 h-4 mr-1"></i> Abrir Câmera
                  </button>
                  <button type="button" id="fechar-camera" 
                          class="bg-gray-600 text-white h-10 w-10 rounded-lg flex items-center justify-center hidden hover:bg-gray-700">
                    <i data-lucide="x" class="w-4 h-4"></i>
                  </button>
                </div>

                <div id="container-camera" class="relative rounded-xl overflow-hidden hidden bg-black">
                  <video id="video-camera" class="w-full h-64 object-cover" autoplay playsinline></video>
                  <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <button type="button" id="capturar-foto-btn" 
                            class="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center p-1 hover:scale-105 transition">
                      <div class="w-14 h-14 bg-red-500 rounded-full"></div>
                    </button>
                  </div>
                </div>

                <div id="galeria-fotos" class="grid grid-cols-3 gap-2 mt-3"></div>
                <p class="text-xs text-gray-500">Toque na foto para removê-la</p>
              </div>

              <!-- BOTÕES -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-6">
                <button type="button" id="btn-salvar" 
                        class="btn-mobile bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                  <i data-lucide="save" class="w-5 h-5"></i>
                  SALVAR
                </button>

                <button type="submit" 
                        class="btn-mobile bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg hover:shadow-xl hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-2 font-semibold">
                  <i data-lucide="file-down" class="w-5 h-5"></i>
                  GERAR PDF
                </button>
              </div>

              <div class="flex gap-3 pt-2">
                <button type="button" onclick="passoAtual--; renderizarPasso();" 
                        class="flex-1 h-12 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-700 font-medium">
                  <i data-lucide="chevron-left" class="w-5 h-5"></i> Voltar
                </button>
              </div>
            </form>
          </div>
        `;

        configurarCanvas('canvas-recebedor');
        if (dadosForm.ass_recebedor) {
          const img = new Image();
          img.src = dadosForm.ass_recebedor;
          img.onload = () => {
            const canvas = document.getElementById('canvas-recebedor');
            const ctx = canvas.getContext('2d');
            canvas.width = canvas.offsetWidth;
            canvas.height = window.innerWidth < 640 ? 120 : 150;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          };
        }
        configurarCameraCorrigida();

        // === BOTÃO SALVAR ===
        document.getElementById('btn-salvar').onclick = () => {
          const drt = document.getElementById('drt-entregador').value.trim();
          if (!drt) {
            alert('Informe a DRT do entregador.');
            return;
          }

          dadosForm.drt_entregador = drt;
          dadosForm.ass_recebedor = document.getElementById('canvas-recebedor').toDataURL();

          const id = idEditando || Date.now().toString();
          const entregaCompleta = { ...dadosForm, id, status: dadosForm.status || 'pendente' };

          if (idEditando) {
            const idx = entregas.findIndex(e => e.id === idEditando);
            entregas[idx] = entregaCompleta;
          } else {
            entregas.push(entregaCompleta);
          }

          try {
            localStorage.setItem('entregas', JSON.stringify(entregas));
            console.log('Recibo salvo:', entregaCompleta);
            alert('Recibo salvo com sucesso no Registro de Entrega!');
          } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar. Tente novamente.');
            return;
          }

          if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

          passoAtual = 1;
          idEditando = null;
          dadosForm = { data_toi: '', uc: '', nome_recebedor: '', endereco: '', cep: '', cidade: '', uf: '', pais: 'Brasil', tentativa1: '', tentativa2: '', tentativa3: '', data_entrega: '', obs: '', status: 'pendente', drt_entregador: '', ass_recebedor: '', fotos: [] };
          irPara('minhas-entregas');
        };

        // === BOTÃO GERAR PDF ===
        document.getElementById('form-assinaturas').onsubmit = e => {
          e.preventDefault();
          const drt = document.getElementById('drt-entregador').value.trim();
          if (!drt) {
            alert('Informe a DRT do entregador.');
            return;
          }

          dadosForm.drt_entregador = drt;
          dadosForm.ass_recebedor = document.getElementById('canvas-recebedor').toDataURL();

          const id = idEditando || Date.now().toString();
          const entregaCompleta = { ...dadosForm, id, status: 'entregue' };

          if (idEditando) {
            const idx = entregas.findIndex(e => e.id === idEditando);
            entregas[idx] = entregaCompleta;
          } else {
            entregas.push(entregaCompleta);
          }

          localStorage.setItem('entregas', JSON.stringify(entregas));

          if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }

          gerarPDF(id);
          alert('PDF gerado e salvo com sucesso!');
          passoAtual = 1;
          idEditando = null;
          dadosForm = { data_toi: '', uc: '', nome_recebedor: '', endereco: '', cep: '', cidade: '', uf: '', pais: 'Brasil', tentativa1: '', tentativa2: '', tentativa3: '', data_entrega: '', obs: '', status: 'pendente', drt_entregador: '', ass_recebedor: '', fotos: [] };
          irPara('minhas-entregas');
        };
      }

      lucide.createIcons();
    }

    function configurarCanvas(id) {
      const canvas = document.getElementById(id);
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = window.innerWidth < 640 ? 120 : 150;
      const ctx = canvas.getContext('2d');
      let desenhando = false;

      function iniciar(e) {
        desenhando = true;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
      }

      function desenhar(e) {
        if (!desenhando) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      function parar() { desenhando = false; }

      canvas.addEventListener('mousedown', iniciar);
      canvas.addEventListener('mousemove', desenhar);
      canvas.addEventListener('mouseup', parar);
      canvas.addEventListener('mouseleave', parar);
      canvas.addEventListener('touchstart', iniciar);
      canvas.addEventListener('touchmove', desenhar);
      canvas.addEventListener('touchend', parar);
    }

    function limparCanvas(id) {
      const canvas = document.getElementById(id);
      if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    }

    function configurarCameraCorrigida() {
      const btnAbrir = document.getElementById('abrir-camera');
      const btnFechar = document.getElementById('fechar-camera');
      const btnCapturar = document.getElementById('capturar-foto-btn');
      const video = document.getElementById('video-camera');
      const container = document.getElementById('container-camera');
      const galeria = document.getElementById('galeria-fotos');
      const canvas = document.createElement('canvas');

      if (!btnAbrir) return;

      btnAbrir.onclick = async () => {
        try {
          if (stream) stream.getTracks().forEach(t => t.stop());
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1920 } }
          });
          video.srcObject = stream;
          container.classList.remove('hidden');
          btnAbrir.classList.add('hidden');
          btnFechar.classList.remove('hidden');
          video.onloadedmetadata = () => video.play();
        } catch (err) {
          alert('Câmera indisponível');
        }
      };

      btnFechar.onclick = () => {
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
          stream = null;
        }
        container.classList.add('hidden');
        btnAbrir.classList.remove('hidden');
        btnFechar.classList.add('hidden');
      };

      btnCapturar.onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        dadosForm.fotos.push(dataUrl);

        const div = document.createElement('div');
        div.className = 'relative group';
        const img = document.createElement('img');
        img.src = dataUrl;
        img.className = 'w-full h-20 object-cover rounded-lg border';
        div.appendChild(img);

        const btnRemover = document.createElement('button');
        btnRemover.innerHTML = '<i data-lucide="x" class="w-4 h-4"></i>';
        btnRemover.className = 'absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition';
        btnRemover.onclick = () => {
          const index = dadosForm.fotos.indexOf(dataUrl);
          if (index > -1) dadosForm.fotos.splice(index, 1);
          div.remove();
        };
        div.appendChild(btnRemover);
        galeria.appendChild(div);
        lucide.createIcons();
        btnFechar.click();
      };
    }

    function gerarPDF(id) {
      const entrega = entregas.find(e => e.id === id);
      if (!entrega) return;
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      let y = 20;

      doc.setFontSize(18);
      doc.text("RECIBO DE ENTREGA", 105, y, { align: 'center' });
      y += 15;

      doc.setFontSize(11);
      doc.text(`Data TOI: ${new Date(entrega.data_toi).toLocaleDateString('pt-BR')}`, 20, y); y += 7;
      doc.text(`UC: ${entrega.uc}`, 20, y); y += 7;
      doc.text(`Recebedor: ${entrega.nome_recebedor}`, 20, y); y += 7;
      doc.text(`Endereço: ${entrega.endereco}, ${entrega.cidade} - ${entrega.uf}`, 20, y); y += 10;

      const tentativas = [entrega.tentativa1, entrega.tentativa2, entrega.tentativa3].filter(Boolean);
      if (tentativas.length > 0) {
        doc.text("Tentativas de entrega:", 20, y); y += 7;
        tentativas.forEach((d, i) => {
          doc.text(`${i+1}ª: ${new Date(d).toLocaleDateString('pt-BR')}`, 30, y); y += 6;
        });
        y += 5;
      }

      if (entrega.data_entrega) doc.text(`Recebido em: ${new Date(entrega.data_entrega).toLocaleDateString('pt-BR')}`, 20, y), y += 7;
      doc.text(`Status: ${statusCfg[entrega.status].texto}`, 20, y); y += 7;
      if (entrega.obs) doc.text(`Tipo: ${entrega.obs}`, 20, y), y += 10;

      doc.setFont('helvetica', 'bold');
      doc.text(`DRT do Entregador: ${entrega.drt_entregador}`, 20, y); y += 12;
      doc.setFont('helvetica', 'normal');

      if (entrega.ass_recebedor) {
        doc.text("Assinatura do Recebedor:", 20, y); y += 8;
        doc.addImage(entrega.ass_recebedor, 'PNG', 20, y, 80, 35); y += 45;
      }

      if (entrega.fotos.length > 0) {
        doc.text("Fotos da entrega:", 20, y); y += 8;
        entrega.fotos.forEach((foto, i) => {
          if (i % 4 === 0 && i > 0) { doc.addPage(); y = 20; }
          const x = 20 + (i % 2) * 85;
          const rowY = y + Math.floor(i / 2) * 60;
          try { doc.addImage(foto, 'JPEG', x, rowY, 80, 60); } catch (e) {}
        });
      }

      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const nomeArquivo = `RECIBO_${entrega.uc}_${entrega.drt_entregador}.pdf`;

      entrega.pdfBase64 = pdfBase64;
      entrega.nomeArquivo = nomeArquivo;
      localStorage.setItem('entregas', JSON.stringify(entregas));

      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,' + pdfBase64;
      link.download = nomeArquivo;
      link.click();
    }

    function baixarPDF(id) {
      const e = entregas.find(x => x.id === id);
      if (!e || !e.pdfBase64) {
        alert('PDF não encontrado. Gere novamente.');
        return;
      }
      const link = document.createElement('a');
      link.href = 'data:application/pdf;base64,' + e.pdfBase64;
      link.download = e.nomeArquivo || 'recibo.pdf';
      link.click();
    }

    function renderizarLista() {
      const termo = document.getElementById('busca').value.toLowerCase();
      const filtro = document.getElementById('filtro-status').value;
      const filtradas = entregas.filter(e => {
        const busca = e.nome_recebedor.toLowerCase().includes(termo) || e.uc.toLowerCase().includes(termo) || e.cidade.toLowerCase().includes(termo);
        const status = filtro === 'todos' || e.status === filtro;
        return busca && status;
      });

      const lista = document.getElementById('lista-entregas');
      if (filtradas.length === 0) {
        lista.innerHTML = `<div class="bg-white shadow-lg rounded-xl p-8 text-center"><p class="text-gray-600">Nenhum registro encontrado</p></div>`;
      } else {
        lista.innerHTML = filtradas.map((e, i) => `
          <div class="bg-white shadow-md rounded-xl p-5 fade-in">
            <div class="flex justify-between items-center mb-3">
              <i data-lucide="file-text" class="w-5 h-5 text-indigo-500"></i>
              <span class="text-xs px-2 py-0.5 rounded-full ${statusCfg[e.status].cor}">${statusCfg[e.status].texto}</span>
            </div>
            <h3 class="font-bold text-base">${e.nome_recebedor}</h3>
            <p class="text-sm text-gray-600">UC: ${e.uc} • ${e.cidade}</p>
            <p class="text-xs text-gray-500">DRT: ${e.drt_entregador}</p>
            ${e.nomeArquivo ? `<p class="text-xs text-green-600 truncate mt-1">${e.nomeArquivo}</p>` : ''}
            <div class="flex gap-2 mt-4">
              <button onclick="verDetalhes('${e.id}')" class="flex-1 btn-mobile border border-gray-300 text-sm flex items-center justify-center gap-1">
                <i data-lucide="eye" class="w-4 h-4"></i> Ver
              </button>
              ${e.pdfBase64 ? `<button onclick="baixarPDF('${e.id}')" class="flex-1 btn-mobile bg-green-100 text-green-700 text-sm flex items-center justify-center gap-1">
                <i data-lucide="download" class="w-4 h-4"></i> PDF
              </button>` : ''}
              <button onclick="excluirEntrega('${e.id}')" class="w-12 btn-mobile bg-red-100 text-red-700 text-sm rounded-xl">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        `).join('');
      }
      lucide.createIcons();
    }

    function verDetalhes(id) {
      const e = entregas.find(x => x.id === id);
      const modal = document.getElementById('conteudo-modal');
      modal.innerHTML = `
        <div class="space-y-4">
          <div class="flex justify-between"><h3 class="font-semibold">Status</h3><span class="${statusCfg[e.status].cor} px-2 py-1 rounded-full text-xs">${statusCfg[e.status].texto}</span></div>
          <hr>
          <div><strong>Data TOI:</strong> ${new Date(e.data_toi).toLocaleDateString('pt-BR')}</div>
          <div><strong>UC:</strong> ${e.uc}</div>
          <div><strong>Recebedor:</strong> ${e.nome_recebedor}</div>
          <div><strong>Endereço:</strong> ${e.endereco}, ${e.cidade} - ${e.uf}</div>
          <div><strong>DRT:</strong> ${e.drt_entregador}</div>
          ${e.ass_recebedor ? `<img src="${e.ass_recebedor}" class="w-full h-32 object-contain border rounded mt-2">` : ''}
          <div class="flex gap-2 mt-4">
            <button onclick="editarEntrega('${e.id}')" class="flex-1 bg-indigo-600 text-white py-2 rounded-lg">Editar</button>
            <button onclick="baixarPDF('${e.id}')" class="flex-1 bg-green-600 text-white py-2 rounded-lg">
              <i data-lucide="download" class="w-4 h-4 inline mr-1"></i> PDF
            </button>
          </div>
        </div>
      `;
      document.getElementById('modal-detalhes').classList.remove('hidden');
      lucide.createIcons();
    }

    function editarEntrega(id) {
      const e = entregas.find(x => x.id === id);
      dadosForm = { ...e };
      idEditando = id;
      document.getElementById('modal-detalhes').classList.add('hidden');
      irPara('nova-entrega');
    }

    function excluirEntrega(id) {
      if (confirm('Excluir este registro?')) {
        entregas = entregas.filter(x => x.id !== id);
        localStorage.setItem('entregas', JSON.stringify(entregas));
        renderizarLista();
      }
    }

    document.getElementById('fechar-modal').addEventListener('click', () => {
      document.getElementById('modal-detalhes').classList.add('hidden');
    });

    document.getElementById('busca').addEventListener('input', renderizarLista);
    document.getElementById('filtro-status').addEventListener('change', renderizarLista);

    irPara('inicio');
