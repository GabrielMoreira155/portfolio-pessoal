/*
  Monta as partes dinâmicas do site a partir de js/dados.js.
  Não precisa mexer aqui para adicionar cases ou projetos.
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
    a.href = isPlaceholder(ig) ? "#contato" : "https://instagram.com/" + encodeURIComponent(ig);
  });
  document.querySelectorAll("[data-instagram-handle]").forEach(function (el) {
    el.innerHTML = txt("@" + ig);
  });

  document.querySelectorAll("[data-virtus]").forEach(function (a) {
    if (isPlaceholder(contato.virtusApex)) {
      a.href = "#sobre";
      a.removeAttribute("target");
      a.innerHTML = "Conhecer a Virtus Apex " + txt("[link]");
    } else {
      a.href = contato.virtusApex;
    }
  });

  // Números
  var numeros = document.getElementById("numeros");
  if (numeros && D.numeros) {
    numeros.innerHTML = D.numeros.map(function (n) {
      return (
        '<div class="stat">' +
          '<span class="stat-pre">' + txt(n.prefixo || "") + "</span>" +
          '<strong class="stat-value">' + txt(n.valor) + "</strong>" +
          '<p class="stat-text">' + txt(n.texto) + "</p>" +
        "</div>"
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

  // Projetos
  var statusNome = {
    "no-ar": "No ar",
    "em-desenvolvimento": "Em desenvolvimento",
    "concluido": "Concluído",
  };
  var seta =
    '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>';

  var projetos = document.getElementById("lista-projetos");
  if (projetos && D.projetos) {
    projetos.innerHTML = D.projetos.map(function (p) {
      var status = statusNome[p.status] ? p.status : "em-desenvolvimento";
      var link = p.link && !isPlaceholder(p.link)
        ? '<a class="project-link" href="' + attr(p.link) + '" target="_blank" rel="noopener">Ver projeto' + seta + "</a>"
        : '<span class="project-link disabled">Link em breve</span>';
      return (
        '<article class="card project">' +
          '<div class="project-shot">' +
            '<img src="' + attr(p.imagem) + '" alt="Print do projeto ' + attr(p.titulo) + '" loading="lazy" decoding="async" width="1200" height="750">' +
          "</div>" +
          '<div class="project-body">' +
            '<div class="project-head">' +
              "<h3>" + txt(p.titulo) + "</h3>" +
              '<span class="status status-' + status + '">' + statusNome[status] + "</span>" +
            "</div>" +
            '<p class="project-desc">' + txt(p.descricao) + "</p>" +
            '<ul class="project-tags">' +
              (p.tags || []).map(function (t) { return '<li class="tag tag-plain">' + txt(t) + "</li>"; }).join("") +
            "</ul>" +
            link +
          "</div>" +
        "</article>"
      );
    }).join("");
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

  var ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();
})();
