/*
  Pulsos de luz da hero.
  O fundo é uma imagem (imagens/hero-poster.webp): um quadro real da cena 3D
  das trilhas de luz (design system Pulsedesk). Aqui só posicionamos pulsos de
  luz em cima das trilhas dessa imagem; quem anima é o CSS (transform e
  opacity, no compositor), então não há custo por quadro na página nem na
  placa de vídeo. Este script roda uma vez e de novo só quando a hero muda de
  tamanho.

  Para os pulsos caírem exatamente sobre as trilhas da imagem, cada trilha é
  projetada com a MESMA câmera e geometria da cena original: câmera em
  (0, 20, 140) olhando para -z, abertura vertical de 55°; trilhas no piso
  (y = 0) até z = -150, curva, e subindo pela parede em z = -160.
*/
(function () {
  'use strict';
  var area = document.getElementById('hero-luzes');
  if (!area) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var TAN = Math.tan((55 / 2) * Math.PI / 180); // metade da abertura vertical
  var CAM_Y = 20, CAM_Z = 140;
  var Z_PERTO = 100;   // onde o pulso nasce (logo abaixo da borda da tela)
  var Z_CURVA = -150;  // fim do piso
  var Z_PAREDE = -160; // parede
  var LINHAS = 100;    // mesma distribuição de trilhas da cena original

  // Posição lateral da trilha i (mesma fórmula da cena original, sem o sorteio)
  function xDaTrilha(i) {
    var n = (i / (LINHAS - 1)) * 2 - 1;
    var exp = Math.sign(n) * Math.pow(Math.abs(n), 1.2);
    return (n * 0.5 + exp * 0.5) * 80;
  }

  // Projeta um ponto 3D na área (largura L, altura A). A escala depende só da
  // altura, igual à imagem encaixada pela altura e centralizada.
  function projetar(x, y, z, L, A) {
    var d = CAM_Z - z; // distância à frente da câmera
    var k = (A / 2) / (d * TAN);
    return { x: L / 2 + x * k, y: A / 2 - (y - CAM_Y) * k };
  }

  // Sorteio fixo (mesmas trilhas e ritmos a cada visita)
  var semente = 7;
  function aleatorio() {
    semente = (semente * 16807) % 2147483647;
    return (semente - 1) / 2147483646;
  }

  // Escolhe as trilhas: mais concentradas no meio, onde o piso encontra a parede
  var escolhidas = [];
  for (var i = 0; i < LINHAS; i += 1) {
    var meio = Math.abs(i - (LINHAS - 1) / 2) / ((LINHAS - 1) / 2);
    if (aleatorio() < 0.3 - meio * 0.15) escolhidas.push(i);
  }

  var pulsos = escolhidas.map(function (i) {
    var duracao = 7 + aleatorio() * 8;         // 7 a 15 s por ciclo (piso + parede)
    var atraso = -aleatorio() * duracao;       // começa em pontos diferentes do ciclo
    var brilho = (0.45 + aleatorio() * 0.5).toFixed(2);
    var grossura = 0.6 + aleatorio() * 0.8;
    var piso = criarPulso('pulso-piso', duracao, atraso, brilho);
    var parede = criarPulso('pulso-parede', duracao, atraso, brilho);
    return { x: xDaTrilha(i), grossura: grossura, piso: piso, parede: parede };
  });

  function criarPulso(classe, duracao, atraso, brilho) {
    var trilho = document.createElement('div');
    trilho.className = 'trilho';
    var pulso = document.createElement('div');
    pulso.className = 'pulso ' + classe;
    pulso.style.setProperty('--duracao', duracao.toFixed(2) + 's');
    pulso.style.setProperty('--atraso', atraso.toFixed(2) + 's');
    pulso.style.setProperty('--brilho', brilho);
    trilho.appendChild(pulso);
    area.appendChild(trilho);
    return trilho;
  }

  function posicionar(trilho, de, para, largura, cauda) {
    var dx = para.x - de.x, dy = para.y - de.y;
    var comprimento = Math.sqrt(dx * dx + dy * dy);
    var angulo = Math.atan2(dx, -dy) * 180 / Math.PI;
    trilho.style.left = de.x.toFixed(1) + 'px';
    trilho.style.top = de.y.toFixed(1) + 'px';
    trilho.style.setProperty('--angulo', angulo.toFixed(2) + 'deg');
    var pulso = trilho.firstChild;
    pulso.style.setProperty('--comprimento', comprimento.toFixed(1) + 'px');
    pulso.style.setProperty('--largura', largura.toFixed(1) + 'px');
    pulso.style.setProperty('--cauda', cauda.toFixed(1) + 'px');
  }

  // Recebe o tamanho direto do ResizeObserver: medir com clientWidth logo na
  // abertura obrigava o navegador a calcular o layout antes da hora (e depois
  // de novo), somando ~150-200 ms de travada.
  var ultimoL = 0, ultimoA = 0;
  function atualizar(L, A) {
    L = Math.round(L); A = Math.round(A);
    if (!L || !A || (L === ultimoL && A === ultimoA)) return;
    ultimoL = L; ultimoA = A;
    pulsos.forEach(function (p) {
      // piso: da borda de baixo até a curva (a animação aplica a perspectiva)
      var perto = projetar(p.x, 0, Z_PERTO, L, A);
      var curva = projetar(p.x, 0, Z_CURVA, L, A);
      posicionar(p.piso, perto, curva, 2.4 * p.grossura, A * 0.22);
      // parede: do pé da parede até o alto (a escala fixa do CSS deixa fino)
      var pe = projetar(p.x, 10, Z_PAREDE, L, A);
      var topo = projetar(p.x, 200, Z_PAREDE, L, A);
      posicionar(p.parede, pe, topo, 10 * p.grossura, A * 0.9);
    });
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(function (entradas) {
      var r = entradas[0].contentRect;
      atualizar(r.width, r.height);
    }).observe(area);
  } else {
    var medir = function () { atualizar(area.clientWidth, area.clientHeight); };
    window.addEventListener('load', medir);
    window.addEventListener('resize', medir);
  }
})();
