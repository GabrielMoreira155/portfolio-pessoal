/*
  Monta as partes dinâmicas do site a partir de js/dados.js.
  Não precisa mexer aqui para adicionar números ou projetos.
*/
(function () {
  var D = window.DADOS || {};
  var contato = D.contato || {};

  // Escapa HTML e destaca [placeholders]
  function txt(s) {
    var safe = String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
    return safe.replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');
  }
  function attr(s) {
    return String(s == null ? "" : s).replace(/"/g, "&quot;");
  }
  function isPlaceholder(s) {
    return !s || /\[.*\]/.test(s);
  }

  // Links de contato
  var numero = String(contato.whatsapp || "").replace(/\D/g, "");
  var waHref = isPlaceholder(contato.whatsapp) || !numero
    ? "#contato"
    : "https://wa.me/" + numero + "?text=" + encodeURIComponent(contato.mensagemWhatsapp || "");
  document.querySelectorAll("[data-whatsapp]").forEach(function (a) {
    a.href = waHref;
    if (waHref.indexOf("https://") === 0) {
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.removeAttribute("target");
    }
  });

  var ig = String(contato.instagram || "").replace(/^@/, "");
  document.querySelectorAll("[data-instagram]").forEach(function (a) {
    if (isPlaceholder(ig) || !ig) {
      a.href = "#contato";
    } else {
      a.href = "https://instagram.com/" + encodeURIComponent(ig);
      a.target = "_blank";
      a.rel = "noopener";
    }
  });
  document.querySelectorAll("[data-instagram-handle]").forEach(function (el) {
    el.innerHTML = txt("@" + ig);
  });

  // Links da Virtus Apex. Enquanto o link não estiver em dados.js, o botão
  // leva para a seção de contato (nunca para "#").
  function linkExterno(a, url) {
    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.href = "#contato";
      a.removeAttribute("target");
    }
  }
  var vSite = isPlaceholder(contato.virtusSite) ? "" : contato.virtusSite;
  var vIg = String(contato.virtusInstagram || "").replace(/^@/, "");
  document.querySelectorAll("[data-virtus-site]").forEach(function (a) { linkExterno(a, vSite); });
  document.querySelectorAll("[data-virtus-instagram]").forEach(function (a) {
    linkExterno(a, isPlaceholder(vIg) || !vIg ? "" : "https://instagram.com/" + encodeURIComponent(vIg));
  });

  // Números em destaque (faixa abaixo do hero)
  var numeros = document.getElementById("numeros");
  if (numeros && D.numeros) {
    numeros.innerHTML = D.numeros.map(function (n) {
      return (
        '<div class="stat">' +
          '<strong class="stat-value">' + txt(n.valor) + "</strong>" +
          '<p class="stat-text">' + txt(n.texto) + "</p>" +
        "</div>"
      );
    }).join("");
  }

  // O que eu faço (faixa abaixo do hero)
  var icones = {
    anuncio: '<path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>',
    site: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/>',
    automacao: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z"/>',
    comercial: '<path d="M4 19V9M10 19V5M16 19v-7M21 19H3"/>'
  };
  var servicos = document.getElementById("servicos");
  if (servicos && D.servicos) {
    servicos.innerHTML = D.servicos.map(function (s) {
      return (
        '<li class="servico">' + txt(s.nome) + "</li>"
      );
    }).join("");
  }

  // Cases
  var cases = document.getElementById("lista-cases");
  if (cases && D.cases) {
    cases.innerHTML = D.cases.map(function (c) {
      var r = c.resultado || {};
      return (
        '<article class="card case">' +
          '<div class="case-top">' +
            '<span class="tag tag-soft">' + txt(c.plataforma) + "</span>" +
            (c.verba ? '<span class="tag tag-plain">' + txt(c.verba) + "</span>" : "") +
          "</div>" +
          "<h3>" + txt(c.segmento) + "</h3>" +
          '<ul class="case-steps">' +
            '<li><span class="case-label">Situação</span><p>' + txt(c.situacao) + "</p></li>" +
            '<li><span class="case-label">O que eu fiz</span><p>' + txt(c.feito) + "</p></li>" +
          "</ul>" +
          '<div class="case-result">' +
            '<span class="case-label">Resultado</span>' +
            "<strong>" + txt(r.destaque) + "</strong>" +
            "<p>" + txt(r.texto) + "</p>" +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  var segs = document.getElementById("lista-segmentos");
  if (segs && D.outrosSegmentos) {
    segs.innerHTML = D.outrosSegmentos.map(function (s) {
      return "<li>" + txt(s) + "</li>";
    }).join("");
  }

  // Projetos: com print (sites) na primeira grade; sem print (tráfego e
  // outros) numa grade de cards compactos logo abaixo.
  var seta =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  function cardProjeto(p) {
    var link = p.link && !isPlaceholder(p.link)
      ? '<a class="project-link" href="' + attr(p.link) + '" target="_blank" rel="noopener">' +
          txt(p.link.replace(/^https?:\/\//, "").replace(/\/$/, "")) + seta + "</a>"
      : (p.link ? '<span class="project-link disabled">Link ' + txt(p.link) + "</span>" : "");
    var tags = [p.segmento, p.tipo].filter(Boolean).map(function (t) {
      return "<li>" + txt(t) + "</li>";
    }).join("");
    return (
      '<article class="card project' + (p.imagem ? "" : " project-compacto") + '">' +
        (p.imagem
          ? '<div class="notebook">' +
              '<div class="notebook-tela"><img src="' + attr(p.imagem) + '" alt="Print do site ' + attr(p.nome) + '" loading="lazy" decoding="async" width="1200" height="750"></div>' +
              '<div class="notebook-base"></div>' +
            "</div>"
          : "") +
        '<div class="project-body">' +
          "<h3>" + txt(p.nome) + "</h3>" +
          '<ul class="project-tags">' + tags + "</ul>" +
          (p.nota ? '<p class="project-result">' + txt(p.nota) + "</p>" : "") +
          link +
        "</div>" +
      "</article>"
    );
  }
  var listaP = document.getElementById("lista-projetos");
  var listaC = document.getElementById("lista-projetos-compactos");
  if (listaP && D.projetos) {
    listaP.innerHTML = D.projetos.filter(function (p) { return p.imagem; }).map(cardProjeto).join("");
  }
  if (listaC && D.projetos) {
    listaC.innerHTML = D.projetos.filter(function (p) { return !p.imagem; }).map(cardProjeto).join("");
  }

  // Além do site: mapa do funil por cliente. Colunas = etapas do funil do
  // topo; cada cliente é uma linha com os pontos acesos onde houve trabalho.
  var ETAPAS = [
    { id: "trafego", nome: "Tráfego", sub: "Meta Ads e Google Ads", icone: icones.anuncio, linha: true },
    { id: "site", nome: "Site", sub: "Site ou landing page", icone: icones.site, linha: true },
    { id: "atendimento", nome: "Atendimento", sub: "WhatsApp e automação", icone: '<path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5Z"/>', linha: true },
    { id: "processo", nome: "Processo", sub: "Estruturação comercial", icone: icones.comercial, linha: true }
  ];
  function iconeEtapa(e) {
    return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + e.icone + "</svg>";
  }
  var cabeca = document.querySelector(".mapa-cabeca");
  if (cabeca) {
    cabeca.innerHTML = '<span></span><div class="mapa-colunas">' + ETAPAS.map(function (e) {
      return '<div class="mapa-col"><span class="mapa-col-nome">' + iconeEtapa(e) + e.nome + '</span><span class="mapa-col-sub">' + e.sub + "</span></div>";
    }).join("") + "</div>";
  }
  var listaA = document.getElementById("lista-alem");
  if (listaA && D.alemDoSite) {
    listaA.innerHTML = D.alemDoSite.map(function (c, i) {
      var et = c.etapas || {};
      var acesas = ETAPAS.map(function (e, k) { return et[e.id] ? k : -1; }).filter(function (k) { return k >= 0; });
      var trilha = "";
      if (acesas.length > 1) {
        for (var k = acesas[0]; k < acesas[acesas.length - 1]; k++) {
          var cheio = et[ETAPAS[k].id] && et[ETAPAS[k + 1].id];
          trilha += '<span class="mapa-trecho' + (cheio ? "" : " mapa-trecho-vazio") + '" style="--k:' + k + '"></span>';
        }
      }
      return (
        '<li class="mapa-linha" style="--linha:' + i + '">' +
          '<div class="mapa-cliente">' +
            '<span class="alem-num">' + (i < 9 ? "0" : "") + (i + 1) + "</span>" +
            "<div><h3>" + txt(c.nome) + "</h3>" + (c.segmento ? "<p>" + txt(c.segmento) + "</p>" : "") + "</div>" +
          "</div>" +
          '<div class="mapa-colunas mapa-pontos">' + trilha +
            ETAPAS.map(function (e, k) {
              var feito = et[e.id];
              var rotulo = '<span class="mapa-rotulo">' + iconeEtapa(e) + e.nome + "</span>";
              if (!feito) {
                return '<div class="mapa-etapa">' + rotulo +
                  '<span class="ponto" role="img" aria-label="' + e.nome + ': não houve trabalho nesta etapa"></span></div>';
              }
              var idb = "balao-" + i + "-" + k;
              return '<div class="mapa-etapa mapa-col-' + k + '">' + rotulo +
                '<button type="button" class="ponto aceso" style="--col:' + k + '" aria-describedby="' + idb + '" aria-label="' + e.nome + '">' +
                  '<span class="balao" role="tooltip" id="' + idb + '">' + txt(feito) + "</span>" +
                "</button></div>";
            }).join("") +
          "</div>" +
        "</li>"
      );
    }).join("");

    // toque: abre o balão do ponto tocado e fecha os outros
    listaA.addEventListener("click", function (e) {
      var b = e.target.closest(".ponto.aceso");
      listaA.querySelectorAll(".ponto.aberto").forEach(function (o) { if (o !== b) o.classList.remove("aberto"); });
      if (b) b.classList.toggle("aberto");
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest("#lista-alem .ponto.aceso")) {
        listaA.querySelectorAll(".ponto.aberto").forEach(function (o) { o.classList.remove("aberto"); });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") listaA.querySelectorAll(".ponto.aberto").forEach(function (o) { o.classList.remove("aberto"); });
    });
  }

  // Enquanto o mapa do funil está na tela, os pulsos de luz do fundo somem
  // (eles cruzariam o painel e os textos da seção). Só troca uma classe.
  var secMapa = document.getElementById("alem-do-site");
  if (secMapa && "IntersectionObserver" in window) {
    new IntersectionObserver(function (itens) {
      document.documentElement.classList.toggle("sem-pulsos", itens[0].isIntersecting);
    }, { rootMargin: "-20% 0px -20% 0px" }).observe(secMapa);
  }

  // Projetos aparecem ao rolar: título e cards sobem em sequência e a tela
  // de cada notebook "abre". Só transform e opacity, uma vez por elemento.
  var revelaveis = document.querySelectorAll("#projetos .section-head > *, #projetos .project, #alem-do-site .section-head > *, #mapa-funil");
  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if ("IntersectionObserver" in window && !semMovimento && revelaveis.length) {
    document.documentElement.classList.add("js-revelar");
    revelaveis.forEach(function (el, i) {
      el.classList.add("revelar");
      // atraso em cascata dentro de cada linha de 3 cards
      el.style.setProperty("--atraso-revelar", (el.classList.contains("project") || el.classList.contains("alem-linha") ? (i % 3) * 70 : i * 60) + "ms");
    });
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (!it.isIntersecting) return;
        var el = it.target;
        el.classList.add("visivel");
        obs.unobserve(el);
        // depois de aparecer, tira o atraso para o hover responder na hora
        setTimeout(function () { el.style.setProperty("--atraso-revelar", "0ms"); }, 1700);
        // mapa do funil: depois que todos os pontos acendem, tira os atrasos
        if (el.id === "mapa-funil") setTimeout(function () { el.classList.add("pronto"); }, 2600);
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });
    revelaveis.forEach(function (el) { obs.observe(el); });
  }

  // Menu mobile
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Abrir menu");
      }
    });
  }

  // Cabeçalho escuro enquanto estiver sobre a hero preta
  var header = document.querySelector(".header");
  var hero = document.querySelector(".hero");
  if (header && hero) {
    var atualizarHeader = function () {
      var sobre = hero.getBoundingClientRect().bottom > header.offsetHeight;
      header.classList.toggle("sobre-hero", sobre);
    };
    atualizarHeader();
    window.addEventListener("scroll", atualizarHeader, { passive: true });
    window.addEventListener("resize", atualizarHeader);
  }

  // Brilho que segue o mouse na hero. Move só com transform (sem repintar)
  // e persegue o cursor com um leve atraso; para quando alcança.
  var luz = document.querySelector(".hero-mouse");
  if (luz && hero && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var alvoX = 0, alvoY = 0, x = 0, y = 0, rodando = false, primeira = true;
    var heroX = 0, heroY = 0; // posição da hero na página (medida fora do movimento)
    var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var medirHero = function () {
      var r = hero.getBoundingClientRect();
      heroX = r.left + window.scrollX; heroY = r.top + window.scrollY;
    };
    var passo = function () {
      var k = suave ? 0.16 : 1;
      x += (alvoX - x) * k; y += (alvoY - y) * k;
      if (Math.abs(alvoX - x) < 0.3 && Math.abs(alvoY - y) < 0.3) { x = alvoX; y = alvoY; rodando = false; }
      luz.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      if (rodando) requestAnimationFrame(passo);
    };
    medirHero();
    window.addEventListener("resize", medirHero);
    window.addEventListener("load", medirHero);
    hero.addEventListener("pointerenter", medirHero);
    hero.addEventListener("pointermove", function (e) {
      alvoX = e.pageX - heroX; alvoY = e.pageY - heroY;
      if (primeira) { x = alvoX; y = alvoY; primeira = false; }
      luz.classList.add("ativo");
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    });
    hero.addEventListener("pointerleave", function () {
      luz.classList.remove("ativo"); primeira = true;
    });
  }

  // Brilho que segue o mouse no site todo (camada fixa atrás das seções).
  // Usa a posição na tela (clientX/Y): nada para medir a cada movimento.
  var luzSite = document.querySelector(".site-mouse");
  if (luzSite && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var sAlvoX = 0, sAlvoY = 0, sx = 0, sy = 0, sRodando = false, sPrimeira = true;
    var sSuave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var sPasso = function () {
      var k = sSuave ? 0.16 : 1;
      sx += (sAlvoX - sx) * k; sy += (sAlvoY - sy) * k;
      if (Math.abs(sAlvoX - sx) < 0.3 && Math.abs(sAlvoY - sy) < 0.3) { sx = sAlvoX; sy = sAlvoY; sRodando = false; }
      luzSite.style.transform = "translate3d(" + sx + "px," + sy + "px,0)";
      if (sRodando) requestAnimationFrame(sPasso);
    };
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      sAlvoX = e.clientX; sAlvoY = e.clientY;
      if (sPrimeira) { sx = sAlvoX; sy = sAlvoY; sPrimeira = false; }
      luzSite.classList.add("ativo");
      if (!sRodando) { sRodando = true; requestAnimationFrame(sPasso); }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () {
      luzSite.classList.remove("ativo"); sPrimeira = true;
    });
  }

  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();
})();
