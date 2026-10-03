/*
  DADOS DO SITE
  Este é o único arquivo que você precisa editar para atualizar
  contatos, números, cases e projetos. O layout se monta sozinho.

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
    // Site ou Instagram da Virtus Apex
    virtusApex: "[link da Virtus Apex]",
  },

  // Faixa de números logo abaixo do hero. Mesmo formato em todos:
  // área (rótulo pequeno), número e o que ele significa.
  numeros: [
    { area: "Tráfego pago", valor: "+118,8%", texto: "de melhora numa campanha de Meta Ads que já rodava e passou para as minhas mãos" },
    { area: "Clientes", valor: "6", texto: "segmentos de negócio diferentes atendidos" },
    { area: "Sites", valor: "7 dias", texto: "no máximo para entregar um site depois de receber os materiais" },
  ],

  // Cases de tráfego. Formato: Situação / O que eu fiz / Resultado
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

  // Linha "Também atendi" abaixo dos cases
  outrosSegmentos: [
    "Farmácia",
    "Clínica de estética",
    "Neuropsicologia",
    "Produtos personalizados",
    "Construtora",
  ],

  /*
    Projetos de desenvolvimento
    imagem: caminho do print dentro de imagens/projetos/ (ideal: .webp, 1200x750)
    status: "no-ar", "em-desenvolvimento" ou "concluido"
    link: deixe "" se ainda não tiver link público
  */
  projetos: [
    {
      titulo: "[Nome do projeto 1]",
      descricao: "[Descrição curta: o que é, para quem e qual problema resolve.]",
      imagem: "imagens/projetos/placeholder.svg",
      tags: ["HTML", "CSS", "JavaScript"],
      status: "no-ar",
      link: "",
    },
    {
      titulo: "[Nome do projeto 2]",
      descricao: "[Descrição curta: o que é, para quem e qual problema resolve.]",
      imagem: "imagens/projetos/placeholder.svg",
      tags: ["Landing page", "Meta Pixel"],
      status: "em-desenvolvimento",
      link: "",
    },
    {
      titulo: "[Nome do projeto 3]",
      descricao: "[Descrição curta: o que é, para quem e qual problema resolve.]",
      imagem: "imagens/projetos/placeholder.svg",
      tags: ["N8N", "Automação"],
      status: "concluido",
      link: "",
    },
  ],
};
