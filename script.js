let carrinho = []; // [{ nome, preco, qtd }]

/* ---------- utilidades ---------- */

function textoParaPreco(texto) {
    const limpo = texto.replace(/[^\d,]/g, '').replace(',', '.');
    const valor = parseFloat(limpo);
    return isNaN(valor) ? 0 : valor;
}

function precoParaTexto(valor) {
    return 'R$ ' + valor.toFixed(2).replace('.', ',');
}

/* ---------- tornar itens do cardápio clicáveis ---------- */

function extrairItem(elemento, comPreco) {
    if (!comPreco) {
        return { nome: elemento.textContent.trim(), preco: 0 };
    }

    const spans = elemento.querySelectorAll('span');

    if (spans.length >= 2) {
        // ex: <div class="item"><span>Nome</span><span>preço</span></div>
        const nome = spans[0].textContent.trim();
        const preco = textoParaPreco(spans[spans.length - 1].textContent);
        return { nome, preco };
    }

    if (spans.length === 1) {
        // ex: <p>300ML <span>9,00</span></p>
        const preco = textoParaPreco(spans[0].textContent);
        const nome = elemento.textContent.replace(spans[0].textContent, '').trim();
        return { nome, preco };
    }

    return { nome: elemento.textContent.trim(), preco: 0 };
}

function destacarClique(elemento) {
    elemento.classList.add('item-selecionado');
    setTimeout(() => elemento.classList.remove('item-selecionado'), 350);
}

function tornarClicaveis(seletor, comPreco) {
    document.querySelectorAll(seletor).forEach((elemento) => {
        elemento.classList.add('produto-clicavel');

        // Elementos nativamente interativos (<button>, <a>) já têm foco e
        // papel de acessibilidade próprios — não sobrescrever com role/tabindex.
        const jaEhInterativo = elemento.tagName === 'BUTTON' || elemento.tagName === 'A';
        if (!jaEhInterativo) {
            elemento.setAttribute('tabindex', '0');
            elemento.setAttribute('role', 'button');
        }

        const clicar = () => {
            const { nome, preco } = extrairItem(elemento, comPreco);
            if (!nome) return;
            adicionarAoCarrinho(nome, preco);
            destacarClique(elemento);
        };

        elemento.addEventListener('click', clicar);

        if (!jaEhInterativo) {
            elemento.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    clicar();
                }
            });
        }
    });
}

/* ---------- carrinho ---------- */

function adicionarAoCarrinho(nome, preco) {
    const existente = carrinho.find((i) => i.nome === nome);
    if (existente) {
        existente.qtd++;
    } else {
        carrinho.push({ nome, preco, qtd: 1 });
    }
    salvarCarrinho();
    renderizarCarrinho();
    pulsarBotaoCarrinho();
}

function alterarQuantidade(nome, delta) {
    const item = carrinho.find((i) => i.nome === nome);
    if (!item) return;

    item.qtd += delta;
    if (item.qtd <= 0) {
        carrinho = carrinho.filter((i) => i.nome !== nome);
    }
    salvarCarrinho();
    renderizarCarrinho();
}

function limparCarrinho() {
    if (carrinho.length === 0) return;
    if (confirm('Deseja limpar todos os itens do pedido?')) {
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
    }
}

function salvarCarrinho() {
    try {
        localStorage.setItem('carrinho-casa-doce-sal', JSON.stringify(carrinho));
    } catch (e) {
        /* localStorage indisponível — segue só em memória */
    }
}

function carregarCarrinho() {
    try {
        const dados = localStorage.getItem('carrinho-casa-doce-sal');
        if (dados) carrinho = JSON.parse(dados);
    } catch (e) {
        carrinho = [];
    }
}

function gerarResumoPedido() {
    if (carrinho.length === 0) return '';
    return carrinho
        .map((item) => {
            const precoTxt = item.preco > 0 ? ' - ' + precoParaTexto(item.preco * item.qtd) : '';
            return `${item.qtd}x ${item.nome}${precoTxt}`;
        })
        .join('\n');
}

function sincronizarCampoPedido() {
    const campo = document.getElementById('pedido1');
    if (campo) campo.value = gerarResumoPedido();
}

function renderizarCarrinho() {
    const lista = document.getElementById('carrinho-itens');
    const contador = document.getElementById('carrinho-contador');
    const totalEl = document.getElementById('carrinho-total');

    lista.innerHTML = '';

    if (carrinho.length === 0) {
        lista.innerHTML = '<p class="carrinho-vazio">Seu pedido está vazio. Clique nos itens do cardápio para adicionar.</p>';
    }

    let total = 0;
    let totalItens = 0;

    carrinho.forEach((item) => {
        total += item.preco * item.qtd;
        totalItens += item.qtd;

        const linha = document.createElement('div');
        linha.className = 'carrinho-item';
        linha.innerHTML = `
            <div class="carrinho-item-info">
                <span class="carrinho-item-nome">${item.nome}</span>
                <span class="carrinho-item-preco">${item.preco > 0 ? precoParaTexto(item.preco * item.qtd) : ''}</span>
            </div>
            <div class="carrinho-item-qtd">
                <button class="qtd-btn" data-nome="${item.nome}" data-delta="-1" aria-label="Diminuir">-</button>
                <span>${item.qtd}</span>
                <button class="qtd-btn" data-nome="${item.nome}" data-delta="1" aria-label="Aumentar">+</button>
            </div>
        `;
        lista.appendChild(linha);
    });

    lista.querySelectorAll('.qtd-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            alterarQuantidade(btn.dataset.nome, Number(btn.dataset.delta));
        });
    });

    totalEl.textContent = precoParaTexto(total);
    contador.textContent = totalItens;
    contador.style.display = totalItens > 0 ? 'flex' : 'none';

    sincronizarCampoPedido();
}

function pulsarBotaoCarrinho() {
    const botao = document.getElementById('carrinho-flutuante');
    botao.classList.add('pulsar');
    setTimeout(() => botao.classList.remove('pulsar'), 300);
}

/* ---------- abrir / fechar painel ---------- */

function iniciarPainelCarrinho() {
    const botao = document.getElementById('carrinho-flutuante');
    const painel = document.getElementById('carrinho-painel');
    const fechar = document.getElementById('fechar-carrinho');
    const limpar = document.getElementById('carrinho-limpar');

    botao.addEventListener('click', () => painel.classList.toggle('aberto'));
    fechar.addEventListener('click', () => painel.classList.remove('aberto'));
    limpar.addEventListener('click', limparCarrinho);

    document.addEventListener('click', (e) => {
        if (!painel.contains(e.target) && !botao.contains(e.target)) {
            painel.classList.remove('aberto');
        }
    });
}

/* ---------- formulário de pedido ---------- */

function iniciarFormularioPedido() {
    const formulario = document.querySelector('.formulario-pedido');
    if (!formulario) return;

    formulario.addEventListener('submit', function (e) {
        e.preventDefault();

        const totalTexto = document.getElementById('carrinho-total').textContent;
        alert(`Pedido enviado! Total: ${totalTexto}\nEm breve entraremos em contato.`);

        this.reset();
        carrinho = [];
        salvarCarrinho();
        renderizarCarrinho();
    });
}

/* ---------- menu hambúrguer ---------- */

function iniciarMenuHamburguer() {
    const botao = document.getElementById('menu-hamburguer');
    const links = document.getElementById('nav-links');
    if (!botao || !links) return;

    const alternarMenu = () => {
        const aberto = links.classList.toggle('aberto');
        botao.classList.toggle('ativo', aberto);
        botao.setAttribute('aria-expanded', String(aberto));
    };

    const fecharMenu = () => {
        links.classList.remove('aberto');
        botao.classList.remove('ativo');
        botao.setAttribute('aria-expanded', 'false');
    };

    botao.addEventListener('click', alternarMenu);

    links.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', fecharMenu);
    });

    document.addEventListener('click', (e) => {
        if (!links.contains(e.target) && !botao.contains(e.target)) {
            fecharMenu();
        }
    });
}

/* ---------- inicialização ---------- */

document.addEventListener('DOMContentLoaded', () => {
    tornarClicaveis('.card-salgados li button', false);
    tornarClicaveis('.milkshake-topo li button', false);
    tornarClicaveis('.tamanhos p', true);
    tornarClicaveis('.item', true);
    tornarClicaveis('.lista-precos p', true);
    tornarClicaveis('.tamanhos-milkshake p', true);

    carregarCarrinho();
    renderizarCarrinho();
    iniciarPainelCarrinho();
    iniciarMenuHamburguer();
    iniciarFormularioPedido();
});