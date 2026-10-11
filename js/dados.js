/*
  DADOS DO SITE
  Este é o único arquivo que você precisa editar para atualizar
  contatos, números, serviços e projetos. O layout se monta sozinho.

  Dica: qualquer texto entre [colchetes] aparece destacado em amarelo
  no site, para você lembrar que ainda é um placeholder.
*/

window.DADOS = {
  contato: {
    // Só números: 55 + DDD + número. Ex.: "5562999999999"
    whatsapp: "[55DDDNUMERO]",
    mensagemWhatsapp:
      "Oi, Gabriel! Vi seu site e quero entender onde meus clientes estão se perdendo.",
    // Sem o @. Ex.: "gabrielmoreira"
    instagram: "[seuperfil]",
    // Virtus Apex: endereço completo do site e @ do Instagram (sem o @)
    virtusSite: "[link do site da Virtus Apex]",
    virtusInstagram: "[perfil da Virtus Apex]",
  },

  // Números em destaque (faixa tirada do site a pedido; ficam guardados aqui)
  numeros: [
    { valor: "6", texto: "segmentos atendidos" },
    { valor: "+118,8%", texto: "nos resultados de uma campanha no Meta Ads" },
    { valor: "2 anos", texto: "trabalhando com tráfego pago" },
  ],

  // Faixa "O que eu faço", logo abaixo dos números (sem números; os resultados
  // ficam nos cases). Ícones disponíveis: anuncio, site, automacao, comercial.
  servicos: [
    { nome: "Meta Ads e Google Ads", icone: "anuncio" },
    { nome: "Sites e landing pages", icone: "site" },
    { nome: "Automações", icone: "automacao" },
    { nome: "Estruturação de Processos Comerciais", icone: "comercial" },
  ],

  // Cases de tráfego. Formato: Situação / O que eu fiz / Resultado
  // (seção tirada do site por enquanto; os dados ficam guardados aqui para
  // quando ela voltar)
  cases: [
    {
      segmento: "Imobiliária",
      plataforma: "Meta Ads",
      verba: "R$ 500 de verba",
      situacao:
        "Uma imobiliária querendo receber contatos de pessoas interessadas em imóveis, com uma verba enxuta.",
      feito:
        "Montei uma campanha de captação no Meta Ads com direcionamento direto para o WhatsApp, para o interessado já cair na conversa com o corretor.",
      resultado: {
        destaque: "[X] leads",
        texto: "Custo por lead de R$ [X], em [X] dias de campanha.",
      },
    },
    {
      segmento: "[Segmento]",
      plataforma: "Meta Ads",
      verba: "Campanha já existente",
      situacao: "A campanha já estava rodando, mas o resultado estava fraco.",
      feito: "Ajustei [o que você mudou na campanha].",
      resultado: {
        destaque: "+118,8%",
        texto: "de melhora nos resultados da campanha.",
      },
    },
  ],

  // Linha "Também atendi" abaixo dos cases (fora do site junto com eles)
  outrosSegmentos: [
    "Farmácia",
    "Clínica de estética",
    "Neuropsicologia",
    "Produtos personalizados",
    "Construtora",
  ],

  /*
    Projetos (seção 01 · O que eu já construí)
    nome, segmento, tipo: textos do card
    link: endereço completo; deixe entre [colchetes] enquanto não tiver
    nota: linha em destaque no card
    imagem: print do site em imagens/projetos/ (ideal: .webp, 1200x750),
            mostrado dentro de um notebook. Sem imagem, o card fica compacto.
  */
  projetos: [
    {
      nome: "Neuropsicóloga",
      segmento: "Saúde",
      tipo: "Site institucional",
      link: "https://psicra.com",
      nota: "Em parceria com a Virtus Apex",
      imagem: "imagens/projetos/psicra.webp",
    },
    {
      nome: "Fondly Sublimados",
      segmento: "Produtos personalizados",
      tipo: "Loja online",
      link: "https://www.fondlysublimados.com.br/",
      nota: "Em parceria com a Virtus Apex",
      imagem: "imagens/projetos/fondly.webp",
    },
    {
      nome: "Residencial Morada dos Sonhos",
      segmento: "Imóveis",
      tipo: "Tráfego pago no Meta Ads",
      link: "https://resmoradadossonhos.com/",
      nota: "Em parceria com a Virtus Apex",
      imagem: "imagens/projetos/morada-dos-sonhos.webp",
    },
    {
      nome: "Rema Engenharia",
      segmento: "Construtora",
      tipo: "Site",
      link: "https://remaengenharia.com/",
      nota: "Em parceria com a Virtus Apex",
      imagem: "imagens/projetos/rema-engenharia.webp",
    },
    {
      nome: "Drogaria Cruzeiro",
      segmento: "Farmácia",
      tipo: "Site",
      link: "https://drogariacruzeiro.site/",
      nota: "Em parceria com a Virtus Apex",
      imagem: "imagens/projetos/drogaria-cruzeiro.webp?v=4",
    },
    {
      nome: "Agencia de Marketing Digital para médicos",
      tipo: "Landing page",
      nota: "Em parceria com a Virtus Apex",
      imagem: "imagens/projetos/virtus-doctor.webp",
    },
  ],

  /*
    Além do site (seção 02): o que mais foi feito em cada empresa.
    feitos: lista do que foi feito. icone: anuncio, automacao, comercial ou site
    comprovante: print de resultado em imagens/resultados/ (deixe "" enquanto
                 não tiver; o espaço só aparece quando houver imagem)
  */
  alemDoSite: [
    {
      nome: "Residencial Morada dos Sonhos",
      segmento: "Imóveis",
      feitos: [
        { icone: "automacao", texto: "Automação do chatbot" },
        { icone: "anuncio", texto: "Campanhas no Meta Ads" },
      ],
      comprovante: "",
    },
    {
      nome: "Neuropsicóloga",
      segmento: "Saúde",
      feitos: [{ icone: "automacao", texto: "Automação" }],
      comprovante: "",
    },
    {
      nome: "Fondly Sublimados",
      segmento: "Produtos personalizados",
      feitos: [{ icone: "automacao", texto: "Automação" }],
      comprovante: "",
    },
    {
      nome: "Drogaria Cruzeiro",
      segmento: "Farmácia",
      feitos: [{ icone: "comercial", texto: "Estruturação de processo comercial" }],
      comprovante: "",
    },
    {
      nome: "Agência de Marketing Digital para médicos",
      segmento: "Marketing médico",
      feitos: [{ icone: "anuncio", texto: "Estruturação de campanhas no Google Ads" }],
      comprovante: "",
    },
  ],
};
